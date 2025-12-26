/*
  # Fix plan_tier constraint

  1. Changes
    - Drop all check constraints on tenants table
    - Ensure plan_tier DEFAULT is set to 'free'

  2. Security
    - No RLS changes
*/

-- Удаляем все check constraints
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'public.tenants'::regclass
      AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE tenants DROP CONSTRAINT ' || constraint_name;
  END LOOP;
END $$;

-- Убеждаемся что DEFAULT установлен корректно
ALTER TABLE tenants ALTER COLUMN plan_tier SET DEFAULT 'free';