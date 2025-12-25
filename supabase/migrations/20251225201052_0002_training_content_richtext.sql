/*
  # Add Rich Text Content Support for Training Docs

  1. Changes
    - Add content_richtext column to training_docs table for HTML/JSON content
    - Create Supabase Storage bucket for training assets
    - Add storage policies for training assets

  2. Notes
    - Existing content field remains for backward compatibility
    - content_richtext will store rich HTML or JSON from editor
*/

-- Add content_richtext column to training_docs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'training_docs' AND column_name = 'content_richtext'
  ) THEN
    ALTER TABLE training_docs ADD COLUMN content_richtext text;
  END IF;
END $$;

-- Create storage bucket for training assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-assets', 'training-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for training assets
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload training assets"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'training-assets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view training assets"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'training-assets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update their training assets"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'training-assets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete their training assets"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'training-assets');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
