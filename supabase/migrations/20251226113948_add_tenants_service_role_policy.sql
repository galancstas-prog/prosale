/*
  # Add Service Role Policy for Tenants

  1. Changes
    - Add INSERT policy for service_role on tenants table
    - Required for registration flow

  2. Security
    - Only service_role can insert tenants during registration
    - Maintains RLS protection for other operations
*/

-- Add service role policy for tenant creation during registration
DO $$ BEGIN
  CREATE POLICY "Service role can insert tenants"
    ON tenants FOR INSERT
    TO service_role
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;