import { createClient } from '@/lib/supabase/server'

export type UserRole = 'ADMIN' | 'MANAGER'

export interface AppUser {
  id: string
  user_id: string
  tenant_id: string
  role: UserRole
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: appUser, error: appUserError } = await supabase
    .from('app_users')
    .select('*, tenants(*)')
    .eq('user_id', user.id)
    .single()

  if (appUserError || !appUser) {
    return null
  }

  return {
    authUser: user,
    appUser: appUser as AppUser & { tenants: Tenant },
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireAdmin() {
  const user = await requireAuth()

  if (user.appUser.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required')
  }

  return user
}
