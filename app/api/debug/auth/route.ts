import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // 1) user из текущей сессии (cookies)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json(
        {
          user: null,
          currentTenant: null,
          isAdmin: false,
          memberships: [],
          error: `auth.getUser(): ${userError.message}`,
        },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          currentTenant: null,
          isAdmin: false,
          memberships: [],
          error: 'No active session (cookies not present).',
        },
        { status: 401 }
      )
    }

    // 2) memberships реальными данными из tenant_members
    const { data: memberships, error: memError } = await supabase
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('user_id', user.id)

    if (memError) {
      return NextResponse.json(
        {
          user: { id: user.id, email: user.email, metadata: user.user_metadata },
          currentTenant: null,
          isAdmin: false,
          memberships: [],
          error: `tenant_members select: ${memError.message}`,
        },
        { status: 500 }
      )
    }

    // 3) currentTenant так, как его видит Postgres/RLS
    const { data: currentTenant, error: tenantFnError } = await supabase.rpc('current_tenant_id')

    // 4) isAdmin так, как его видит Postgres/RLS
    const { data: isAdmin, error: adminFnError } = await supabase.rpc('is_tenant_admin')

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      memberships: (memberships || []).map((m) => ({
        tenantId: m.tenant_id,
        role: m.role,
      })),
      currentTenant: tenantFnError ? null : currentTenant ?? null,
      isAdmin: adminFnError ? false : !!isAdmin,
      errors: {
        current_tenant_id: tenantFnError?.message ?? null,
        is_tenant_admin: adminFnError?.message ?? null,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        user: null,
        currentTenant: null,
        isAdmin: false,
        memberships: [],
        error: error?.message || 'Unexpected error',
      },
      { status: 500 }
    )
  }
}