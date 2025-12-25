# Multi-Tenant SaaS Platform

A production-ready multi-tenant SaaS MVP built with Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Features

### Part 1 - Foundation

- **Authentication System**
  - Email/password registration and login
  - Protected routes with middleware
  - Server-side session handling
  - Automatic tenant creation on signup

- **Multi-Tenancy**
  - Tenant isolation with RLS (Row Level Security)
  - Role-based access control (ADMIN, MANAGER)
  - Automatic user-tenant association

- **Internationalization (i18n)**
  - English and Russian language support
  - Persistent locale selection via localStorage
  - Language switcher in UI

- **Application Shell**
  - Responsive sidebar navigation
  - Dashboard with content tiles
  - Admin-only navigation sections
  - Modern, clean UI design

### Part 2 - Scripts Module

- **Script Categories**
  - ADMIN: Create and organize script categories
  - View categories as interactive tiles
  - Navigate through category hierarchy

- **Script Threads**
  - ADMIN: Create conversation script threads within categories
  - Organize scripts by topic and use case
  - View all threads in a category

- **Conversation Turns**
  - ADMIN: Add, edit, delete, and reorder conversation turns
  - Define speaker (Manager/Client) for each message
  - Inline editing with save/cancel
  - Reorder messages with up/down buttons

- **Chat UI**
  - Beautiful alternating chat bubbles (Manager vs Client)
  - One-click copy for Manager messages (clipboard)
  - Empty states for no content
  - Loading states during operations

- **Role-Based Access**
  - ADMIN: Full CRUD access to all script content
  - MANAGER: Read-only access to all scripts
  - Server-side permission enforcement
  - RLS policies ensure data isolation

- **Demo Content**
  - One-click "Create Demo Content" button (Admin only)
  - Generates sample sales scripts with full conversation
  - Perfect for testing and onboarding

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Auth, Postgres, RLS)
- **Database**: PostgreSQL with Row Level Security

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - Project name
   - Database password (save this!)
   - Region
4. Wait for the project to be created (takes ~2 minutes)

### 2. Configure Supabase

#### Apply Database Migration

1. In your Supabase project, navigate to **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the migration file at `supabase/migrations/0001_init.sql` (created by the tool)
4. Copy the entire contents of the migration file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration
7. Verify success - you should see a green success message

The migration creates:
- All necessary tables (tenants, app_users, categories, etc.)
- Helper functions (current_tenant_id, current_user_role, is_admin)
- Row Level Security policies for tenant isolation
- Indexes for performance

**Note**: The migration is idempotent and safe to run multiple times.

#### Get Your API Keys

1. In your Supabase project, go to **Project Settings** (gear icon)
2. Click on **API** in the left sidebar
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" - the `anon` `public` key)
   - **service_role key** (under "Project API keys" - click "Reveal" next to `service_role` key)

**Warning**: Keep the `service_role` key secret! Never commit it to version control or expose it in client-side code.

### 3. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Replace the placeholder values with your actual Supabase credentials from step 2

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 6. Build for Production

```bash
npm run build
```

## Project Structure

```
.
├── app/
│   ├── (auth)/              # Auth pages (login, register)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── app/                 # Protected app pages
│   │   ├── admin/           # Admin-only pages
│   │   ├── scripts/         # Scripts (placeholder)
│   │   ├── training/        # Training (placeholder)
│   │   ├── faq/             # FAQ (placeholder)
│   │   ├── knowledge/       # Knowledge Base (placeholder)
│   │   ├── layout.tsx       # App shell with navigation
│   │   └── page.tsx         # Dashboard
│   ├── page.tsx             # Landing page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── app-shell.tsx        # Main app navigation shell
│   └── locale-switcher.tsx  # Language switcher
├── lib/
│   ├── supabase/            # Supabase client utilities
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Middleware helper
│   ├── auth/
│   │   └── user.ts          # Auth helper functions
│   ├── i18n/                # Internationalization
│   │   ├── translations.ts  # Translation dictionary
│   │   └── use-locale.tsx   # Locale context/hook
│   └── utils.ts             # Utility functions
├── supabase/
│   └── migrations/
│       └── 0001_init.sql    # Database schema migration
├── middleware.ts            # Route protection middleware
└── .env.local               # Environment variables (create this)
```

## Database Schema

### Core Tables

- **tenants**: Organization/company records
- **app_users**: Links auth.users to tenants with roles
- **categories**: Content categorization (scripts, training, FAQ, KB)
- **script_threads**: Conversation script threads
- **script_turns**: Individual turns in scripts
- **training_docs**: Training documents
- **training_progress**: User training progress tracking
- **faq_items**: FAQ entries
- **kb_pages**: Knowledge base pages
- **kb_attachments**: File attachments for KB

### Security

All tables have Row Level Security (RLS) enabled with the following rules:

- **Tenant Isolation**: Users can only access data from their own tenant
- **ADMIN Role**: Full read/write access to all tenant data
- **MANAGER Role**:
  - Read access to all tenant content
  - Can only write their own training_progress

## Test Checklist

Follow these steps to verify the application is working correctly:

### 1. Register Admin User
- [ ] Navigate to [http://localhost:3000](http://localhost:3000)
- [ ] Click "Get Started" or navigate to `/register`
- [ ] Fill in:
  - Company Name: "Test Company"
  - Email: "admin@test.com"
  - Password: "password123" (min 6 characters)
- [ ] Click "Create Account"
- [ ] Verify you are redirected to `/app` (Dashboard)
- [ ] Verify you see the dashboard with 4 tiles

### 2. Test Dashboard Navigation
- [ ] Verify sidebar shows all navigation items:
  - Dashboard
  - Scripts
  - Training
  - FAQ
  - Knowledge Base
  - Admin section (Settings, Users)
- [ ] Click each navigation item
- [ ] Verify placeholder pages load correctly
- [ ] Verify "Admin" navigation section is visible (you're an ADMIN)

### 3. Test Admin Pages
- [ ] Navigate to "Admin Settings" (`/app/admin`)
- [ ] Verify you see your company name and role
- [ ] Navigate to "Users" (`/app/admin/users`)
- [ ] Verify the placeholder page loads

### 4. Test Internationalization
- [ ] Click the language switcher (EN/RU button) in the header
- [ ] Verify UI text changes to Russian
- [ ] Switch back to English
- [ ] Refresh the page - verify language persists

### 5. Test Logout
- [ ] Click "Logout" button in the sidebar
- [ ] Verify you are redirected to `/login`
- [ ] Verify you cannot access `/app` without logging in

### 6. Test Login
- [ ] Navigate to `/login`
- [ ] Enter credentials:
  - Email: "admin@test.com"
  - Password: "password123"
- [ ] Click "Sign In"
- [ ] Verify you are redirected to `/app`

### 7. Test Route Protection
- [ ] While logged out, try to access `/app` directly
- [ ] Verify you are redirected to `/login?redirect=/app`
- [ ] After logging in, verify you are redirected back to `/app`

### 8. Test Responsive Design
- [ ] Resize browser window to mobile size
- [ ] Verify hamburger menu appears
- [ ] Click hamburger menu
- [ ] Verify sidebar slides in
- [ ] Click outside sidebar
- [ ] Verify sidebar closes

### 9. Test Database Isolation
- [ ] Register a second account with different company:
  - Company: "Test Company 2"
  - Email: "admin2@test.com"
  - Password: "password123"
- [ ] Log in with the new account
- [ ] Verify you see "Test Company 2" in the header
- [ ] Log out and log back in with "admin@test.com"
- [ ] Verify you see "Test Company" in the header

### 10. Verify Error Handling
- [ ] Try to register with an existing email
- [ ] Verify error message is displayed
- [ ] Try to login with wrong password
- [ ] Verify error message is displayed
- [ ] Try to register with password < 6 characters
- [ ] Verify validation error

## Routes

### Public Routes
- ✅ `/` - Landing page with feature overview
- ✅ `/login` - Login page with email/password authentication
- ✅ `/register` - Registration page (creates tenant + admin user)

### Protected Routes (require authentication)
- ✅ `/app` - Dashboard with demo content button
- ✅ `/app/scripts` - Scripts categories list (Part 2)
- ✅ `/app/scripts/[categoryId]` - Script threads in a category (Part 2)
- ✅ `/app/scripts/thread/[threadId]` - Conversation view with chat UI (Part 2)
- ✅ `/app/training` - Training categories list (Part 3)
- ✅ `/app/training/[categoryId]` - Training documents in a category (Part 3)
- ✅ `/app/training/doc/[docId]` - Training document viewer with progress (Part 3)
- ⏳ `/app/faq` - FAQ (placeholder)
- ⏳ `/app/knowledge` - Knowledge Base (placeholder)
- ✅ `/app/admin/progress` - Training progress dashboard (Part 3, ADMIN only)

### Middleware Protection
- All `/app/*` routes require authentication
- Unauthenticated users are redirected to `/login`
- Authenticated users trying to access `/login` or `/register` are redirected to `/app`

## User Roles

### ADMIN
- Full access to all features
- Can create/read/update/delete all content in their tenant
- Can manage users
- Can access admin pages
- Automatically assigned to the first user who creates a tenant

### MANAGER (for future implementation)
- Read-only access to all content
- Can track their own training progress
- Cannot access admin pages
- Cannot manage users or content

## Environment Variables

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Security Note**:
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses RLS - use with caution

## Troubleshooting

### Build Errors

**Problem**: `Cannot find module '@supabase/ssr'`
```bash
npm install @supabase/ssr
```

**Problem**: TypeScript errors in build
```bash
npm run typecheck
```

### Database Issues

**Problem**: "relation does not exist" errors
- Ensure you've run the migration SQL in Supabase SQL Editor
- Check that all tables were created successfully

**Problem**: "No rows returned" when trying to access app
- Ensure your user was created in `app_users` table during registration
- Check Supabase logs for errors

### Authentication Issues

**Problem**: Can't login after registration
- Verify Supabase Auth is enabled in your project
- Check that email confirmation is disabled (Settings > Authentication > Email Auth)
- Verify your API keys are correct in `.env.local`

**Problem**: Redirected to login immediately after registering
- Check browser console for errors
- Verify the registration successfully created tenant and app_user records
- Check Supabase logs

### Route Protection Issues

**Problem**: Can access `/app` without logging in
- Verify `middleware.ts` is in the root directory
- Check that middleware config includes the correct paths
- Restart the dev server

## Testing Part 2 - Scripts Module

After setting up the application, test the Scripts functionality:

### Admin User Testing

1. **Create Demo Content**
   - [ ] Login as admin
   - [ ] On dashboard, click "Create Demo Content"
   - [ ] Verify success message
   - [ ] Verify redirect to Scripts page
   - [ ] Verify "Sales Scripts" category appears

2. **View Demo Content**
   - [ ] Click "Sales Scripts" category
   - [ ] Verify "Cold Call - Product Introduction" thread appears
   - [ ] Click the thread
   - [ ] Verify conversation with 7 messages appears
   - [ ] Verify Manager messages have copy button (hover to see)
   - [ ] Click copy button on a Manager message
   - [ ] Verify message copied to clipboard

3. **Create New Category**
   - [ ] Go back to Scripts page
   - [ ] Click "New Category" button
   - [ ] Enter name: "Support Scripts"
   - [ ] Enter description (optional)
   - [ ] Click "Create Category"
   - [ ] Verify new category appears

4. **Create New Thread**
   - [ ] Click into your new category
   - [ ] Click "New Script Thread"
   - [ ] Enter title: "Customer Onboarding"
   - [ ] Enter description (optional)
   - [ ] Click "Create Thread"
   - [ ] Verify new thread appears

5. **Add Messages**
   - [ ] Click into your new thread
   - [ ] In "Add Message" form, select "Manager" as speaker
   - [ ] Enter a message
   - [ ] Click "Add Message"
   - [ ] Verify message appears in chat
   - [ ] Add a "Client" message
   - [ ] Verify alternating bubble colors (Manager: gray, Client: blue)

6. **Edit Messages**
   - [ ] Hover over a message
   - [ ] Click edit icon (pencil)
   - [ ] Modify the message text
   - [ ] Click "Save"
   - [ ] Verify message updated
   - [ ] Click "Cancel" on another edit
   - [ ] Verify no changes made

7. **Reorder Messages**
   - [ ] Hover over a message (not first or last)
   - [ ] Click up arrow
   - [ ] Verify message moved up
   - [ ] Click down arrow
   - [ ] Verify message moved down
   - [ ] Try up arrow on first message (should be disabled)
   - [ ] Try down arrow on last message (should be disabled)

8. **Delete Messages**
   - [ ] Hover over a message
   - [ ] Click delete icon (trash)
   - [ ] Confirm deletion
   - [ ] Verify message removed

### Manager User Testing

1. **Create Manager User** (requires database access)
   - Option 1: Register another account, then manually update role in Supabase
   - Option 2: Wait for Part 3 user invitation feature

2. **Manager View Access**
   - [ ] Login as manager
   - [ ] Navigate to Scripts
   - [ ] Verify can see all categories
   - [ ] Verify "New Category" button NOT visible
   - [ ] Click into a category
   - [ ] Verify "New Script Thread" button NOT visible
   - [ ] Click into a thread
   - [ ] Verify can see all messages
   - [ ] Verify "Add Message" form NOT visible
   - [ ] Hover over messages - verify no edit/delete/reorder buttons
   - [ ] Verify copy button works on Manager messages

## Testing Part 3 - Training Module

After setting up the application, test the Training functionality:

### Admin User Testing

1. **Create Training Category**
   - [ ] Navigate to Training
   - [ ] Click "New Category"
   - [ ] Enter name: "Product Training"
   - [ ] Enter description (optional)
   - [ ] Click "Create Category"
   - [ ] Verify category appears

2. **Create Training Document**
   - [ ] Click into "Product Training" category
   - [ ] Click "New Training Document"
   - [ ] Enter title: "Product Overview"
   - [ ] Use rich text editor:
     - [ ] Type some text and make it bold
     - [ ] Add a heading
     - [ ] Create a bullet list
     - [ ] Add a numbered list
     - [ ] Click image button and upload an image
     - [ ] Add a link to external URL
   - [ ] Click "Create Document"
   - [ ] Verify document appears

3. **Edit Training Content**
   - [ ] Click into training document
   - [ ] Click "Edit Content"
   - [ ] Modify content in editor
   - [ ] Click "Save"
   - [ ] Verify changes persist
   - [ ] Click "Cancel" to test abort

4. **View Progress Dashboard**
   - [ ] Navigate to Admin > Training Progress
   - [ ] Verify statistics cards display
   - [ ] Verify table shows your user + all documents
   - [ ] Verify all show "Not Started" status
   - [ ] Use search bar to filter
   - [ ] Verify search works

### Manager User Testing

1. **View Training Materials**
   - [ ] Login as manager
   - [ ] Navigate to Training
   - [ ] Verify can see categories
   - [ ] Verify "New Category" button NOT visible
   - [ ] Click into category
   - [ ] Verify can see documents
   - [ ] Verify "New Training Document" button NOT visible

2. **View Training Document**
   - [ ] Click into a training document
   - [ ] Verify status badge shows "In Progress" (automatic)
   - [ ] Verify content displays with formatting
   - [ ] Verify images display
   - [ ] Verify "Edit Content" button NOT visible
   - [ ] Verify "Mark as Completed" button IS visible

3. **Complete Training**
   - [ ] Click "Mark as Completed"
   - [ ] Verify status changes to "Completed"
   - [ ] Verify "Mark as Completed" button is replaced with completion message
   - [ ] Refresh page
   - [ ] Verify status persists as "Completed"

4. **Verify Admin Sees Progress**
   - [ ] Logout manager, login as admin
   - [ ] Navigate to Admin > Training Progress
   - [ ] Verify manager's completed document shows "Completed" status
   - [ ] Verify last updated timestamp is recent

### Part 3 - Training Module

- **Training Categories**
  - ADMIN: Create and organize training categories
  - View categories as tiles
  - Navigate to training materials

- **Training Documents with Rich Text Editor**
  - ADMIN: Create documents with full rich text editing
  - Bold, italic, headings, lists, links
  - Upload and embed images directly in content
  - Image storage in Supabase Storage
  - Edit training content inline

- **Progress Tracking**
  - MANAGER: Automatic "In Progress" when opening document
  - MANAGER: "Mark as Completed" button
  - Status persists across sessions (Not Started, In Progress, Completed)
  - Progress tied to individual managers

- **Admin Progress Dashboard**
  - View all manager progress in consolidated table
  - Manager × Document matrix showing all combinations
  - Status badges with color coding
  - Summary statistics (Total, Completed, In Progress, Not Started)
  - Search/filter by manager or document
  - Last updated timestamps

- **Rich Text Editor (TipTap)**
  - Formatting toolbar with all common options
  - Image upload to Supabase Storage bucket
  - Public URL generation for images
  - Read-only mode for managers
  - Edit mode for admins

## Next Steps (Part 4)

Part 4 could implement:
- FAQ management with search/filtering
- Knowledge Base with file attachments
- User invitation system for managers
- Training completion certificates
- Due dates and reminders
- Additional demo content for all modules

## License

MIT

## Support

For issues or questions, please check:
1. Supabase logs in your project dashboard
2. Browser console for frontend errors
3. Next.js build output for compilation errors
