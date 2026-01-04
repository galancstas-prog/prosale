-- AI Search Database Setup
-- Run this SQL in your Supabase SQL Editor to set up AI search functionality

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ai_chunks table
CREATE TABLE IF NOT EXISTS ai_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  entity_id text NOT NULL,
  title text NOT NULL,
  url_path text NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ai_chunks_module_idx ON ai_chunks(module);
CREATE INDEX IF NOT EXISTS ai_chunks_entity_id_idx ON ai_chunks(entity_id);
CREATE INDEX IF NOT EXISTS ai_chunks_embedding_idx ON ai_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE ai_chunks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_chunks' AND policyname = 'Authenticated users can read ai_chunks'
  ) THEN
    CREATE POLICY "Authenticated users can read ai_chunks"
      ON ai_chunks FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_chunks' AND policyname = 'Authenticated users can insert ai_chunks'
  ) THEN
    CREATE POLICY "Authenticated users can insert ai_chunks"
      ON ai_chunks FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_chunks' AND policyname = 'Authenticated users can update ai_chunks'
  ) THEN
    CREATE POLICY "Authenticated users can update ai_chunks"
      ON ai_chunks FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ai_chunks' AND policyname = 'Authenticated users can delete ai_chunks'
  ) THEN
    CREATE POLICY "Authenticated users can delete ai_chunks"
      ON ai_chunks FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create match function for vector similarity search
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
    AND 1 - (ai_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY ai_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
