import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const adminClient = createAdminClient()

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

    const userId = authData.user.id

    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .insert({
        name: companyName,
        plan_tier: 'free',
      })
      .select()
      .single()

    if (tenantError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { ok: false, error: 'Failed to create workspace: ' + tenantError.message },
        { status: 400 }
      )
    }

    const { error: appUserError } = await adminClient
      .from('app_users')
      .insert({
        id: userId,
        tenant_id: tenant.id,
        email: email,
        role: 'ADMIN',
        full_name: companyName,
      })

    if (appUserError) {
      await adminClient.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { ok: false, error: 'Failed to create user profile: ' + appUserError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
