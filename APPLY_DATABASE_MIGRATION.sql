-- ============================================
-- DATABASE MIGRATION - APPLY THIS IN SUPABASE
-- ============================================
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor
-- Copy this entire file and execute it
-- ============================================

-- Categories table (for both Scripts and Training)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT NULL,
  name text NOT NULL,
  description text DEFAULT NULL,
  type text NOT NULL CHECK (type IN ('script', 'training')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
CREATE POLICY "Allow all access to categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Script threads table
CREATE TABLE IF NOT EXISTS script_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT NULL,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE script_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to script_threads" ON script_threads;
CREATE POLICY "Allow all access to script_threads"
  ON script_threads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Script turns table
CREATE TABLE IF NOT EXISTS script_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES script_threads(id) ON DELETE CASCADE,
  speaker text NOT NULL CHECK (speaker IN ('agent', 'client')),
  message text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE script_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to script_turns" ON script_turns;
CREATE POLICY "Allow all access to script_turns"
  ON script_turns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Training docs table
CREATE TABLE IF NOT EXISTS training_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  content_richtext text NOT NULL,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to training_docs" ON training_docs;
CREATE POLICY "Allow all access to training_docs"
  ON training_docs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Training progress table
CREATE TABLE IF NOT EXISTS training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  doc_id uuid REFERENCES training_docs(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to training_progress" ON training_progress;
CREATE POLICY "Allow all access to training_progress"
  ON training_progress
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to faq_items" ON faq_items;
CREATE POLICY "Allow all access to faq_items"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- KB pages table
CREATE TABLE IF NOT EXISTS kb_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT NULL,
  title text NOT NULL,
  content_richtext text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kb_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to kb_pages" ON kb_pages;
CREATE POLICY "Allow all access to kb_pages"
  ON kb_pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables have been created with RLS enabled.
-- You can now use the application!
-- ============================================
