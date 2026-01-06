import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // 1. Получаем пользователя из cookies
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          user: null,
          currentTenant: null,
          isAdmin: false,
          memberships: [],
          error: userError?.message ?? 'No active session',
        },
        { status: 401 }
      )
    }

    // 2. Получаем memberships
    const { data: memberships, error: memError } = await supabase
      .from('tenant_members')
      .select('tenant_id, role')
      .eq('user_id', user.id)

    if (memError) {
      return NextResponse.json(
        {
          user: { id: user.id, email: user.email },
          currentTenant: null,
          isAdmin: false,
          memberships: [],
          error: memError.message,
        },
        { status: 500 }
      )
    }

    const list = memberships ?? []
    const current = list[0] ?? null
    const isAdmin = current?.role?.toUpperCase() === 'ADMIN'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      currentTenant: current?.tenant_id ?? null,
      isAdmin,
      memberships: list.map((m) => ({
        tenantId: m.tenant_id,
        role: m.role,
      })),
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        user: null,
        currentTenant: null,
        isAdmin: false,
        memberships: [],
        error: e?.message ?? 'Unexpected error',
      },
      { status: 500 }
    )
  }
}