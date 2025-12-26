/*
  # Simple tenant insert function

  Create a simple function to insert tenants that bypasses PostgREST cache
*/

CREATE OR REPLACE FUNCTION public.create_new_tenant(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (name, plan_tier, max_users, max_storage_mb, max_api_calls, settings)
  VALUES (p_name, 'free', 5, 100, 1000, '{}'::jsonb)
  RETURNING id INTO v_tenant_id;
  
  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_new_tenant(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_new_tenant(text) TO authenticated;