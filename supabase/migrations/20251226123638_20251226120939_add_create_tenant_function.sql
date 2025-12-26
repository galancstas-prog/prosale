/*
  # Add create_tenant function

  1. Changes
    - Create function to insert tenant directly via SQL
    - This bypasses PostgREST cache issues

  2. Security
    - Only service_role can call this function
*/

-- Создаем функцию для создания tenant
CREATE OR REPLACE FUNCTION create_tenant(tenant_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  plan_tier TEXT,
  max_users INTEGER,
  max_storage_mb INTEGER,
  max_api_calls INTEGER,
  stripe_customer_id TEXT,
  settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO tenants (name, plan_tier, max_users, max_storage_mb, max_api_calls, settings)
  VALUES (tenant_name, 'free', 5, 100, 1000, '{}'::jsonb)
  RETURNING 
    tenants.id,
    tenants.name,
    tenants.created_at,
    tenants.updated_at,
    tenants.plan_tier,
    tenants.max_users,
    tenants.max_storage_mb,
    tenants.max_api_calls,
    tenants.stripe_customer_id,
    tenants.settings;
END;
$$;

-- Разрешаем вызывать только service_role
REVOKE ALL ON FUNCTION create_tenant(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_tenant(TEXT) TO service_role;