/*
  # Multi-Tenant Setup with current_tenant_id() Function

  This migration sets up the multi-tenant infrastructure with automatic tenant_id management.

  1. Creates helper functions:
     - current_tenant_id() - Returns current user's tenant_id
     - is_tenant_admin() - Checks if current user is admin

  2. Updates all tables to use tenant_id with proper defaults

  3. Updates RLS policies to be tenant-scoped
*/

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current tenant_id (returns user's tenant_id from metadata or user.id as fallback)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_id uuid;
BEGIN
  -- Get tenant_id from user metadata, or use user.id as fallback
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid,
    auth.uid()
  ) INTO tenant_id;

  RETURN tenant_id;
END;
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, all authenticated users are admins
  -- This can be extended later with proper role checking
  RETURN auth.uid() IS NOT NULL;
END;
$$;

-- ============================================
-- UPDATE TABLES WITH tenant_id DEFAULTS
-- ============================================

-- Update ai_chunks table
DO $$
BEGIN
  -- Add tenant_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_chunks' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE ai_chunks ADD COLUMN tenant_id uuid;
  END IF;

  -- Set default for tenant_id
  ALTER TABLE ai_chunks ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();
END $$;

-- Update categories table
ALTER TABLE categories ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- Update script_threads table
ALTER TABLE script_threads ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- Update training_docs table
ALTER TABLE training_docs ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- Update faq_items table
ALTER TABLE faq_items ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- Update kb_pages table
ALTER TABLE kb_pages ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id();

-- ============================================
-- UPDATE RLS POLICIES TO BE TENANT-SCOPED
-- ============================================

-- Categories
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
CREATE POLICY "Tenant users can access own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Script threads
DROP POLICY IF EXISTS "Allow all access to script_threads" ON script_threads;
CREATE POLICY "Tenant users can access own script_threads"
  ON script_threads
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Script turns (access through parent thread's tenant)
DROP POLICY IF EXISTS "Allow all access to script_turns" ON script_turns;
CREATE POLICY "Tenant users can access own script_turns"
  ON script_turns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM script_threads
      WHERE script_threads.id = script_turns.thread_id
      AND script_threads.tenant_id = public.current_tenant_id()
    )
  );

-- Training docs
DROP POLICY IF EXISTS "Allow all access to training_docs" ON training_docs;
CREATE POLICY "Tenant users can access own training_docs"
  ON training_docs
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Training progress (access based on user_id)
DROP POLICY IF EXISTS "Allow all access to training_progress" ON training_progress;
CREATE POLICY "Users can access own training_progress"
  ON training_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- FAQ items
DROP POLICY IF EXISTS "Allow all access to faq_items" ON faq_items;
CREATE POLICY "Tenant users can access own faq_items"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- KB pages
DROP POLICY IF EXISTS "Allow all access to kb_pages" ON kb_pages;
CREATE POLICY "Tenant users can access own kb_pages"
  ON kb_pages
  FOR ALL
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- AI chunks
DROP POLICY IF EXISTS "Authenticated users can read ai_chunks" ON ai_chunks;
DROP POLICY IF EXISTS "Authenticated users can insert ai_chunks" ON ai_chunks;
DROP POLICY IF EXISTS "Authenticated users can update ai_chunks" ON ai_chunks;
DROP POLICY IF EXISTS "Authenticated users can delete ai_chunks" ON ai_chunks;

CREATE POLICY "Tenant users can read own ai_chunks"
  ON ai_chunks FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant users can insert own ai_chunks"
  ON ai_chunks FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant users can update own ai_chunks"
  ON ai_chunks FOR UPDATE
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY "Tenant users can delete own ai_chunks"
  ON ai_chunks FOR DELETE
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- ============================================
-- UPDATE match_ai_chunks FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION match_ai_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  filter_modules text[] DEFAULT ARRAY['scripts', 'training', 'faq', 'kb']
)
RETURNS TABLE (
  id uuid,
  module text,
  entity_id text,
  title text,
  url_path text,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ai_chunks.id,
    ai_chunks.module,
    ai_chunks.entity_id,
    ai_chunks.title,
    ai_chunks.url_path,
    ai_chunks.chunk_text,
    ai_chunks.metadata,
    1 - (ai_chunks.embedding <=> query_embedding) AS similarity
  FROM ai_chunks
  WHERE ai_chunks.module = ANY(filter_modules)
    AND ai_chunks.tenant_id = public.current_tenant_id()
    AND 1 - (ai_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Then restart your dev server for changes to take effect
