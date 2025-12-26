/*
  # Add RPC to insert tenants directly

  Bypasses PostgREST cache issues with constraints
*/

DROP FUNCTION IF EXISTS insert_tenant_direct(TEXT);

CREATE FUNCTION insert_tenant_direct(company_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  INSERT INTO tenants (name, plan_tier, max_users, max_storage_mb, max_api_calls, settings)
  VALUES (company_name, 'free', 5, 100, 1000, '{}'::jsonb)
  RETURNING id INTO new_tenant_id;
  
  RETURN jsonb_build_object('id', new_tenant_id);
END;
$$;

GRANT EXECUTE ON FUNCTION insert_tenant_direct(TEXT) TO service_role;