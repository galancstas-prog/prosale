/*
  # Fix app_users to use id as auth user reference

  1. Changes
    - Make app_users.id the primary key that references auth.users.id
    - Remove user_id column (redundant with id)
    - Update all policies that depend on user_id column

  2. Security
    - Maintain RLS policies
    - Update policies to work with new schema

  3. Notes
    - This migration fixes the schema to be consistent
    - app_users.id is the auth user id
    - training_progress.user_id references app_users.id (not app_users.user_id)
*/

-- Step 1: Drop policies on training_progress that reference app_users.user_id
DROP POLICY IF EXISTS "Users can view their own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can insert their own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can update their own training progress" ON training_progress;

-- Step 2: Drop policies on app_users
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON app_users;
DROP POLICY IF EXISTS "Admins can view all users in tenant" ON app_users;
DROP POLICY IF EXISTS "Admins can insert users in tenant" ON app_users;
DROP POLICY IF EXISTS "Admins can update users in tenant" ON app_users;
DROP POLICY IF EXISTS "Users can view tenant users" ON app_users;
DROP POLICY IF EXISTS "Service role can insert users" ON app_users;

-- Step 3: Drop foreign key constraints
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_user_id_fkey;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_id_fkey;

-- Step 4: Drop unique constraint on user_id
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_user_id_key;

-- Step 5: Drop user_id column
ALTER TABLE app_users DROP COLUMN IF EXISTS user_id CASCADE;

-- Step 6: Remove default from id column
ALTER TABLE app_users ALTER COLUMN id DROP DEFAULT;

-- Step 7: Add foreign key constraint to id referencing auth.users
ALTER TABLE app_users
  ADD CONSTRAINT app_users_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 8: Ensure RLS is enabled
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Step 9: Recreate app_users policies
CREATE POLICY "Users can view own profile"
  ON app_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view tenant users"
  ON app_users FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM app_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile"
  ON app_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert users"
  ON app_users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can insert tenant users"
  ON app_users FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update tenant users"
  ON app_users FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM app_users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Step 10: Recreate training_progress policies (updated to use app_users.id)
CREATE POLICY "Users can view their own training progress"
  ON training_progress FOR SELECT
  TO authenticated
  USING (
    (tenant_id = current_tenant_id()) AND 
    ((user_id = auth.uid()) OR is_admin())
  );

CREATE POLICY "Users can insert their own training progress"
  ON training_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    (tenant_id = current_tenant_id()) AND 
    (user_id = auth.uid())
  );

CREATE POLICY "Users can update their own training progress"
  ON training_progress FOR UPDATE
  TO authenticated
  USING (
    (tenant_id = current_tenant_id()) AND 
    (user_id = auth.uid())
  )
  WITH CHECK (
    (tenant_id = current_tenant_id()) AND 
    (user_id = auth.uid())
  );