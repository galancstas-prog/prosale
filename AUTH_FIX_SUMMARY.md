# Authentication & Registration Fix Summary

## Problem
The registration and login flow was failing with "An unexpected error occurred" because:
1. Code used `app_users.user_id` but the schema had both `id` and `user_id` columns
2. RLS policies prevented inserts during registration
3. Foreign key references were inconsistent between `app_users.id` and `app_users.user_id`

## Solution
Fixed the schema to be consistent: `app_users.id` is the auth user id (no separate `user_id` column).

---

## Files Created

### 1. `/lib/supabase/admin.ts`
**Purpose**: Server-only Supabase client with service role key for privileged operations

**Key Features**:
- Uses `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Bypasses RLS for system operations (registration, user creation)
- Never exposed to client-side code
- Used only in API route handlers

**Usage**:
```typescript
import { createAdminClient } from '@/lib/supabase/admin'

const adminClient = createAdminClient()
// Can insert into any table, bypassing RLS
await adminClient.from('tenants').insert(...)
```

---

## Files Modified

### 1. `/lib/auth/user.ts`
**Changes**:
- Removed `user_id` from `AppUser` interface
- Changed `.eq('user_id', user.id)` to `.eq('id', user.id)`
- Changed `.single()` to `.maybeSingle()` for safer null handling

**Before**:
```typescript
export interface AppUser {
  id: string
  user_id: string  // ❌ Redundant
  tenant_id: string
  ...
}

const { data: appUser } = await supabase
  .from('app_users')
  .select('*, tenants(*)')
  .eq('user_id', user.id)  // ❌ Wrong column
  .single()
```

**After**:
```typescript
export interface AppUser {
  id: string  // ✅ This IS the auth user id
  tenant_id: string
  ...
}

const { data: appUser } = await supabase
  .from('app_users')
  .select('*, tenants(*)')
  .eq('id', user.id)  // ✅ Correct column
  .maybeSingle()
```

### 2. `/app/api/auth/register/route.ts`
**Changes**:
- Added `createAdminClient` import
- Use admin client for tenant and app_users inserts (bypasses RLS)
- Changed `user_id: userId` to `id: userId` in app_users insert
- Added cleanup on failure (delete auth user if tenant/app_users creation fails)
- Better error logging

**Key Flow**:
```typescript
// 1. Create auth user (normal client)
const { data: authData } = await supabase.auth.signUp(...)
const userId = authData.user.id

// 2. Create tenant (admin client to bypass RLS)
const { data: tenant } = await adminClient
  .from('tenants')
  .insert({ name: companyName })

// 3. Create app_users record (admin client to bypass RLS)
await adminClient
  .from('app_users')
  .insert({
    id: userId,  // ✅ Use id, not user_id
    tenant_id: tenant.id,
    email: email,
    role: 'ADMIN',
  })

// 4. On failure, cleanup auth user
if (error) {
  await adminClient.auth.admin.deleteUser(userId)
}
```

### 3. `/.env`
**Changes**:
- Added `SUPABASE_SERVICE_ROLE_KEY` placeholder
- Reordered variables for clarity

**Required Variables**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Security Notes**:
- `SUPABASE_SERVICE_ROLE_KEY` is **NEVER** exposed to client
- Only used in server-side API routes
- Required for registration flow to bypass RLS

---

## Database Migration Applied

### Migration: `fix_app_users_schema`

**Changes**:
1. Dropped all policies that referenced `app_users.user_id`
2. Dropped `user_id` column from `app_users` table
3. Removed default `gen_random_uuid()` from `app_users.id`
4. Added foreign key: `app_users.id` → `auth.users.id` (ON DELETE CASCADE)
5. Recreated RLS policies for `app_users` using `id` column
6. Recreated `training_progress` policies to use `auth.uid()` directly

**Schema After Migration**:
```sql
-- app_users table
CREATE TABLE app_users (
  id uuid PRIMARY KEY,  -- Auth user id (no default)
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  role user_role NOT NULL DEFAULT 'MANAGER',
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT app_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- training_progress references app_users.id
CREATE TABLE training_progress (
  ...
  user_id uuid NOT NULL REFERENCES app_users(id),
  ...
);
```

**RLS Policies Created**:
- `Users can view own profile`: `auth.uid() = id`
- `Users can view tenant users`: Same tenant check
- `Service role can insert users`: For registration
- `Admins can insert/update tenant users`: Admin checks

---

## How Registration Works Now

### Step-by-Step Flow

1. **User submits registration form** (`/register`)
   - Company Name, Email, Password
   - Form submits via `fetch('/api/auth/register')`

2. **API creates auth user** (`/api/auth/register/route.ts`)
   ```typescript
   const { data: authData } = await supabase.auth.signUp({
     email,
     password,
   })
   const userId = authData.user.id
   ```

3. **API creates tenant** (using admin client)
   ```typescript
   const adminClient = createAdminClient()
   const { data: tenant } = await adminClient
     .from('tenants')
     .insert({ name: companyName })
   ```

4. **API creates app_users record** (using admin client)
   ```typescript
   await adminClient
     .from('app_users')
     .insert({
       id: userId,  // Sets app_users.id = auth.users.id
       tenant_id: tenant.id,
       email: email,
       role: 'ADMIN',
       full_name: companyName,
     })
   ```

5. **Client auto-logs in** (`/register page`)
   ```typescript
   // After successful registration
   await fetch('/api/auth/login', {
     body: JSON.stringify({ email, password })
   })

   // Then redirect
   router.push('/app')
   ```

6. **Protected pages load user** (`/lib/auth/user.ts`)
   ```typescript
   const { data: authUser } = await supabase.auth.getUser()

   const { data: appUser } = await supabase
     .from('app_users')
     .select('*, tenants(*)')
     .eq('id', authUser.id)  // ✅ Matches app_users.id
     .maybeSingle()
   ```

---

## Why This Fix Works

### Before (Broken)
```
auth.users.id = "uuid-123"
  ↓
app_users.id = "uuid-456" (auto-generated)
app_users.user_id = "uuid-123" (references auth.users)
  ↓
training_progress.user_id = "uuid-456" (references app_users.id)
  ❌ But training_progress policies checked app_users.user_id!
```

### After (Fixed)
```
auth.users.id = "uuid-123"
  ↓
app_users.id = "uuid-123" (same as auth user)
  ↓
training_progress.user_id = "uuid-123" (references app_users.id)
  ✅ Everything references the same id
```

**Benefits**:
1. Single source of truth for user identity
2. Simpler foreign key relationships
3. RLS policies are clearer: `auth.uid() = id`
4. No confusion between `id` and `user_id`

---

## Environment Variables Required

### Client-Side (Exposed to Browser)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Server-Side (Secret)
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to Get Service Role Key**:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Under "Project API keys", find `service_role`
4. Click "Reveal" to show the key
5. Copy it to your `.env` file

**⚠️ CRITICAL SECURITY WARNING**:
- **NEVER** commit `SUPABASE_SERVICE_ROLE_KEY` to git
- **NEVER** expose it in client-side code
- **NEVER** use it in browser/client components
- Only use it in:
  - API route handlers (`/app/api/**`)
  - Server components (if needed)
  - Server actions (if enabled)

---

## Test Checklist

### ✅ Registration Flow
1. Navigate to `/register`
2. Fill in:
   - Company Name: "Test Company"
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Create Account"
4. **Expected**: Redirected to `/app` dashboard
5. **Expected**: No errors in console
6. **Verify**: User appears in Supabase auth.users table
7. **Verify**: Tenant created in tenants table
8. **Verify**: app_users record created with `id = auth_user_id`

### ✅ Login Flow
1. Navigate to `/login`
2. Enter credentials from registration
3. Click "Sign In"
4. **Expected**: Redirected to `/app`
5. **Expected**: Dashboard loads with user info
6. **Expected**: No errors

### ✅ Protected Routes
1. Try accessing `/app` while logged out
2. **Expected**: Redirected to `/login`
3. Login
4. **Expected**: Redirected back to `/app`

### ✅ Database Consistency
Run these queries in Supabase SQL Editor:

```sql
-- Check that app_users.id matches auth.users.id
SELECT
  au.id as app_user_id,
  u.id as auth_user_id,
  au.email,
  au.role
FROM app_users au
JOIN auth.users u ON au.id = u.id;

-- Should show rows where both IDs match
```

```sql
-- Check that user_id column is gone
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'app_users';

-- Should NOT show user_id in results
```

### ✅ Multi-Tenant Isolation
1. Register second account with different email/company
2. Login with first account
3. **Expected**: Can only see own tenant's data
4. Login with second account
5. **Expected**: Can only see second tenant's data

### ✅ Admin Operations
1. Login as admin (first registered user)
2. Navigate to Scripts
3. Click "Create Demo Content"
4. **Expected**: Demo category and scripts created
5. **Expected**: All demo content visible

### ✅ Error Handling
1. Try registering with existing email
2. **Expected**: Clear error message
3. Try login with wrong password
4. **Expected**: Clear error message
5. Try registering without filling all fields
6. **Expected**: Validation errors

---

## Troubleshooting

### "An unexpected error occurred" on registration

**Check**:
1. `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
2. Service role key is correct (not anon key)
3. Database migration was applied successfully
4. Check server logs for actual error

**Solution**:
```bash
# Verify env variable is loaded
echo $SUPABASE_SERVICE_ROLE_KEY

# Restart dev server
npm run dev
```

### "Failed to create user profile" error

**Cause**: RLS blocking insert even with service role

**Solution**:
1. Verify migration applied: Check policies in Supabase dashboard
2. Ensure "Service role can insert users" policy exists
3. Verify `createAdminClient` is using correct key

### "No rows returned" when loading app

**Cause**: `getCurrentUser()` can't find app_users record

**Check**:
```sql
-- In Supabase SQL Editor
SELECT * FROM app_users WHERE id = 'your-auth-user-id';
```

**Solution**:
- If no record: Registration didn't complete, try again
- If `user_id` column exists: Migration didn't run, apply it
- If `id` doesn't match auth user: Data corruption, recreate account

### Build fails with module not found

**Check**:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## Files Changed Summary

### Created (3 files)
1. `/lib/supabase/admin.ts` - Admin client for privileged operations
2. `/app/api/auth/register/route.ts` - Registration route handler
3. `/app/api/auth/login/route.ts` - Login route handler
4. `/app/api/auth/logout/route.ts` - Logout route handler

### Modified (4 files)
1. `/lib/auth/user.ts` - Fixed AppUser interface and queries
2. `/app/login/page.tsx` - Updated to use fetch API
3. `/app/register/page.tsx` - Updated to use fetch API
4. `/.env` - Added SUPABASE_SERVICE_ROLE_KEY

### Database (1 migration)
1. `fix_app_users_schema` - Removed user_id, fixed policies

---

## Architecture Diagram

```
┌─────────────────┐
│   Browser       │
│  /register page │
└────────┬────────┘
         │ POST { email, password, companyName }
         ↓
┌─────────────────────────────────┐
│  /api/auth/register             │
│  (Route Handler)                │
│                                 │
│  1. createClient()              │
│     → auth.signUp()             │
│     → Get userId                │
│                                 │
│  2. createAdminClient()         │
│     → Insert tenant             │
│     → Insert app_users          │
│     →   id: userId ✅           │
│                                 │
│  3. Return { ok: true }         │
└────────┬────────────────────────┘
         │ { ok: true }
         ↓
┌─────────────────┐
│   Browser       │
│  /register page │
│                 │
│  POST /api/auth/login           │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│  /api/auth/login                │
│  (Route Handler)                │
│                                 │
│  supabase.auth.signInWithPassword│
│  Return { ok: true }            │
└────────┬────────────────────────┘
         │ { ok: true }
         ↓
┌─────────────────┐
│   Browser       │
│  router.push('/app')            │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│  /app (Protected Page)          │
│                                 │
│  getCurrentUser()               │
│  → supabase.auth.getUser()      │
│  → SELECT * FROM app_users      │
│     WHERE id = auth.uid()       │
│                                 │
│  Return user + tenant data      │
└─────────────────────────────────┘
```

---

## Summary

✅ **Fixed**: `app_users` schema now uses `id` as the auth user reference
✅ **Fixed**: Registration uses admin client to bypass RLS
✅ **Fixed**: All queries updated to use `app_users.id`
✅ **Fixed**: RLS policies updated for new schema
✅ **Added**: Service role key for privileged operations
✅ **Added**: Cleanup on registration failure
✅ **Tested**: Build completes successfully
✅ **Documented**: Complete setup and troubleshooting guide

The application now has a working registration and login flow with proper multi-tenant isolation and role-based access control.
