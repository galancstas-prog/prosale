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
          error: userError.message,
        },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          error: 'No active session',
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      error: null,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        user: null,
        error: error?.message || 'Unexpected error',
      },
      { status: 500 }
    )
  }
}