# Quick Test Checklist

Follow this checklist to verify the application works end-to-end.

## Prerequisites

**Required Environment Variables** (in `.env` file):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get the service role key from: Supabase Dashboard → Settings → API → Project API keys → service_role (click "Reveal")

---

## Test Flow

### 1. Register Admin User
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to http://localhost:3000/register
- [ ] Fill in registration form:
  - Company Name: "Test Company"
  - Email: "admin@test.com"
  - Password: "password123"
- [ ] Click "Create Account"
- [ ] ✅ **Expected**: Redirect to `/app` dashboard
- [ ] ✅ **Expected**: See dashboard with 4 content tiles
- [ ] ✅ **Expected**: No errors in browser console

### 2. Test Admin Features
- [ ] Click "Scripts" in sidebar
- [ ] Click "Create Demo Content" button
- [ ] ✅ **Expected**: Success message appears
- [ ] ✅ **Expected**: Redirect to Scripts page
- [ ] ✅ **Expected**: "Sales Scripts" category appears
- [ ] Click "Sales Scripts" category
- [ ] ✅ **Expected**: See demo script thread
- [ ] Click into thread
- [ ] ✅ **Expected**: See conversation with multiple messages
- [ ] Hover over Manager message
- [ ] Click copy button
- [ ] ✅ **Expected**: Message copied to clipboard

### 3. Test Training Module
- [ ] Navigate to "Training" in sidebar
- [ ] Click "New Category"
- [ ] Create category: "Product Training"
- [ ] ✅ **Expected**: Category appears
- [ ] Click into category
- [ ] Click "New Training Document"
- [ ] Create document with rich text:
  - Title: "Product Overview"
  - Add bold text, headings, bullet list
- [ ] ✅ **Expected**: Document created and displays

### 4. Test Logout/Login
- [ ] Click "Logout" in sidebar
- [ ] ✅ **Expected**: Redirect to `/login`
- [ ] Enter credentials:
  - Email: "admin@test.com"
  - Password: "password123"
- [ ] Click "Sign In"
- [ ] ✅ **Expected**: Redirect to `/app`
- [ ] ✅ **Expected**: Dashboard loads correctly

### 5. Create Manager User (Optional)

**Option A: Register Second Account**
- [ ] Logout
- [ ] Register new account:
  - Company Name: "Manager Test Company"
  - Email: "manager@test.com"
  - Password: "password123"
- [ ] ✅ **Expected**: New tenant created
- [ ] Manually update role in Supabase:
  ```sql
  UPDATE app_users
  SET role = 'MANAGER'
  WHERE email = 'manager@test.com';
  ```

**Option B: Use SQL to Create Manager**
```sql
-- Get your tenant_id first
SELECT id, name FROM tenants;

-- Insert manager (replace tenant_id and auth_user_id)
INSERT INTO auth.users (id, email)
VALUES ('your-new-uuid', 'manager@test.com');

INSERT INTO app_users (id, tenant_id, email, role)
VALUES ('your-new-uuid', 'your-tenant-id', 'manager@test.com', 'MANAGER');
```

### 6. Test Manager Access
- [ ] Login as manager
- [ ] Navigate to Scripts
- [ ] ✅ **Expected**: Can view categories
- [ ] ✅ **Expected**: "New Category" button NOT visible
- [ ] Click into category
- [ ] ✅ **Expected**: Can view threads
- [ ] ✅ **Expected**: "New Script Thread" button NOT visible
- [ ] Click into thread
- [ ] ✅ **Expected**: Can view messages
- [ ] ✅ **Expected**: No edit/delete buttons
- [ ] ✅ **Expected**: Copy button works

### 7. Test Training Progress (Manager)
- [ ] Navigate to Training
- [ ] Click into "Product Training" category
- [ ] Click into training document
- [ ] ✅ **Expected**: Status badge shows "In Progress"
- [ ] Click "Mark as Completed"
- [ ] ✅ **Expected**: Status changes to "Completed"
- [ ] Refresh page
- [ ] ✅ **Expected**: Status persists

### 8. Test Admin Progress Dashboard
- [ ] Logout manager, login as admin
- [ ] Navigate to Admin → Training Progress
- [ ] ✅ **Expected**: See statistics cards
- [ ] ✅ **Expected**: See progress table with all users × documents
- [ ] ✅ **Expected**: Manager's completed doc shows "Completed"
- [ ] Use search bar
- [ ] ✅ **Expected**: Filter works correctly

### 9. Test Multi-Tenant Isolation
- [ ] Register third account with different company
- [ ] ✅ **Expected**: Cannot see other tenants' data
- [ ] Login with first admin account
- [ ] ✅ **Expected**: Can only see own tenant's data

### 10. Test Error Handling
- [ ] Try to register with existing email
- [ ] ✅ **Expected**: Clear error message displayed
- [ ] Try to login with wrong password
- [ ] ✅ **Expected**: Clear error message displayed
- [ ] Try to access `/app` while logged out
- [ ] ✅ **Expected**: Redirect to `/login`

---

## Common Issues

### "An unexpected error occurred" on registration
**Fix**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env` file

### "No rows returned" when loading app
**Fix**: Check that `app_users` record was created during registration

### Cannot see demo content
**Fix**: Ensure you're logged in as ADMIN role

### Build errors
**Fix**: Run `npm install` and restart dev server

---

## Success Criteria

✅ All tests pass without errors
✅ Registration creates tenant + admin user
✅ Login works for all users
✅ Admin can create and manage all content
✅ Manager can view content but not edit
✅ Training progress tracking works
✅ Multi-tenant isolation maintained
✅ Error messages are clear and helpful

---

## Database Verification

Run in Supabase SQL Editor:

```sql
-- Check app_users schema
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'app_users'
ORDER BY ordinal_position;

-- Should show: id, tenant_id, role, email, full_name, created_at, updated_at
-- Should NOT show: user_id

-- Check that app_users.id matches auth.users.id
SELECT
  au.id,
  au.email,
  au.role,
  t.name as company
FROM app_users au
JOIN tenants t ON au.tenant_id = t.id
JOIN auth.users u ON au.id = u.id;

-- All IDs should match
```

---

## Support

If any test fails:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify environment variables are set correctly
4. Review `AUTH_FIX_SUMMARY.md` for detailed troubleshooting
