/*
  # Disable tenant trigger

  Temporarily disable the trigger to avoid cache conflicts
*/

DROP TRIGGER IF EXISTS tenant_fill_defaults ON tenants;