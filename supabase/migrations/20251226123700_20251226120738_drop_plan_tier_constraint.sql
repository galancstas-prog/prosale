/*
  # Drop plan_tier check constraint

  1. Changes
    - Drop the check constraint on plan_tier column
    - This allows any value for plan_tier

  2. Security
    - No RLS changes
*/

-- Удаляем check constraint если он существует
DO $$ 
BEGIN
  -- Пробуем удалить constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tenants_plan_tier_check'
  ) THEN
    ALTER TABLE tenants DROP CONSTRAINT tenants_plan_tier_check;
  END IF;

  -- Также попробуем другие возможные имена
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname LIKE '%plan_tier%' 
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE tenants DROP CONSTRAINT ' || conname
      FROM pg_constraint 
      WHERE conname LIKE '%plan_tier%' 
        AND conrelid = 'public.tenants'::regclass
      LIMIT 1
    );
  END IF;
END $$;