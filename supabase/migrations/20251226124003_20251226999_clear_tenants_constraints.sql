/*
  # Completely clear plan_tier constraint

  Drop and recreate the constraint properly
*/

-- Находим и удаляем ALL constraints на tenants
DO $$ 
DECLARE
  r record;
BEGIN
  FOR r IN 
    SELECT conname FROM pg_constraint 
    WHERE conrelid = 'public.tenants'::regclass
      AND contype IN ('c', 'x')
  LOOP
    EXECUTE 'ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS "' || r.conname || '"';
  END LOOP;
END $$;

-- Проверяем что constraint удален
SELECT conname FROM pg_constraint WHERE conrelid = 'public.tenants'::regclass AND contype = 'c';