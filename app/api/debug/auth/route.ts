import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

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
          error: 'Auth session missing!',
        },
        { status: 401 }
      )
    }

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

    const list = memberships || []
    const currentTenant = list.length > 0 ? list[0].tenant_id : null
    const currentMembership = list.find((m) => m.tenant_id === currentTenant)
    const isAdmin = currentMembership ? String(currentMembership.role).toUpperCase() === 'ADMIN' : false

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      memberships: list.map((m) => ({ tenantId: m.tenant_id, role: m.role })),
      currentTenant,
      isAdmin,
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