/*
  # Fix tenants table - make plan_tier nullable

  1. Changes
    - Make plan_tier column nullable if it exists
    - Add plan_tier column if it doesn't exist with default value

  2. Security
    - No changes to RLS policies
*/

-- Проверяем существует ли колонка plan_tier и делаем её nullable с default
DO $$ 
BEGIN
  -- Если колонка существует, делаем её nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tenants' 
      AND column_name = 'plan_tier'
  ) THEN
    ALTER TABLE tenants ALTER COLUMN plan_tier DROP NOT NULL;
    ALTER TABLE tenants ALTER COLUMN plan_tier SET DEFAULT 'free';
  ELSE
    -- Если колонки нет, создаём её
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';
  END IF;

  -- Также проверим и исправим другие возможные колонки
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 100;
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_api_calls INTEGER DEFAULT 1000;
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

END $$;