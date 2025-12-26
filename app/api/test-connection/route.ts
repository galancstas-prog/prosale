import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results = {
    envVars: {
      status: 'ok',
      url: false,
      anonKey: false,
      serviceRoleKey: false,
    },
    database: {
      status: 'unknown',
      tables: [] as string[],
      error: null as string | null,
    },
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    results.envVars.url = !!supabaseUrl && !supabaseUrl.includes('your-project')
    results.envVars.anonKey = !!supabaseAnonKey && supabaseAnonKey.length > 20
    results.envVars.serviceRoleKey =
      !!supabaseServiceKey &&
      supabaseServiceKey !== 'your_service_role_key_here' &&
      supabaseServiceKey.length > 20

    if (!results.envVars.url || !results.envVars.anonKey) {
      results.envVars.status = 'error'
      return NextResponse.json(results)
    }

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)

    if (error) {
      results.database.status = 'error'
      results.database.error = error.message
    } else {
      results.database.status = 'ok'

      const tables = [
        'tenants',
        'app_users',
        'categories',
        'script_threads',
        'script_turns',
        'training_docs',
        'training_progress'
      ]

      results.database.tables = tables
    }
  } catch (error) {
    results.database.status = 'error'
    results.database.error = String(error)
  }

  return NextResponse.json(results)
}
