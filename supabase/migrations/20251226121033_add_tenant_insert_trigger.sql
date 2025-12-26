/*
  # Add trigger to auto-fill tenant fields

  1. Changes
    - Create trigger function to fill plan_tier automatically
    - This works around PostgREST cache issues

  2. Security
    - No security changes
*/

-- Создаем функцию-триггер
CREATE OR REPLACE FUNCTION fill_tenant_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Заполняем plan_tier если не указан
  IF NEW.plan_tier IS NULL THEN
    NEW.plan_tier := 'free';
  END IF;

  -- Заполняем остальные поля если не указаны
  IF NEW.max_users IS NULL THEN
    NEW.max_users := 5;
  END IF;

  IF NEW.max_storage_mb IS NULL THEN
    NEW.max_storage_mb := 100;
  END IF;

  IF NEW.max_api_calls IS NULL THEN
    NEW.max_api_calls := 1000;
  END IF;

  IF NEW.settings IS NULL THEN
    NEW.settings := '{}'::jsonb;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер
DROP TRIGGER IF EXISTS tenant_fill_defaults ON tenants;
CREATE TRIGGER tenant_fill_defaults
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION fill_tenant_defaults();