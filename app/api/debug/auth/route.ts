import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({
        user: null,
        currentTenant: null,
        isAdmin: false,
        memberships: [],
        error: userError.message,
      })
    }

    if (!user) {
      return NextResponse.json({
        user: null,
        currentTenant: null,
        isAdmin: false,
        memberships: [],
      })
    }

    const tenantId = user.user_metadata?.tenant_id || user.id

    const isAdmin = true

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      },
      currentTenant: tenantId,
      isAdmin,
      memberships: [
        {
          tenantId,
          role: 'admin',
        }
      ],
    })
  } catch (error: any) {
    return NextResponse.json({
      user: null,
      currentTenant: null,
      isAdmin: false,
      memberships: [],
      error: error.message,
    }, { status: 500 })
  }
}
