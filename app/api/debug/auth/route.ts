import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()

    console.log('[DEBUG AUTH]', { user: data.user, error })

    return NextResponse.json({
      user: data.user ?? null,
      error: error?.message ?? null,
    })
  } catch (e: any) {
    console.error('[DEBUG AUTH ERROR]', e)
    return NextResponse.json({
      user: null,
      error: e?.message ?? 'Unknown error',
    })
  }
}