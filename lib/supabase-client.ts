import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE // 'spa' | 'ssr'

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // ✅ Bolt Preview: SPA режим (localStorage) — вход стабилен
  if (mode === 'spa') {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    return client
  }

  // ✅ Netlify/Prod: SSR режим (cookies)
  client = createBrowserClient(url, anonKey)
  return client
}