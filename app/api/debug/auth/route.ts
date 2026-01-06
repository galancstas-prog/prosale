import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/Bolt Database-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return NextResponse.json({ user: null, error: error.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ user: null, error: 'No active session' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      error: null,
    })
  } catch (e: any) {
    return NextResponse.json(
      { user: null, error: e?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}