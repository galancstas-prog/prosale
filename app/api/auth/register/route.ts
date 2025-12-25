import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, companyName } = body

    if (!email || !password || !companyName) {
      return NextResponse.json(
        { ok: false, error: 'Email, password, and company name are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          company_name: companyName,
        },
      },
    })

    if (signUpError) {
      return NextResponse.json(
        { ok: false, error: signUpError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { ok: false, error: 'Failed to create account' },
        { status: 400 }
      )
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: companyName,
      })
      .select()
      .single()

    if (tenantError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to create workspace: ' + tenantError.message },
        { status: 400 }
      )
    }

    const { error: appUserError } = await supabase
      .from('app_users')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenant.id,
        email: email,
        role: 'ADMIN',
        full_name: companyName,
      })

    if (appUserError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to create user profile: ' + appUserError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
