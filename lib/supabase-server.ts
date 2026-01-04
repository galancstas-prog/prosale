import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  // В Bolt/превью и при некоторых предрендерах cookies() может быть недоступен.
  // Тогда Next кидает:
  // "Invariant: cookies() expects to have requestAsyncStorage, none available."
  // Поэтому делаем safe fallback.
  let cookieStore: ReturnType<typeof cookies> | null = null

  try {
    cookieStore = cookies()
  } catch (e) {
    cookieStore = null
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || !anonKey) {
    throw new Error(
      'Missing env vars for Supabase server client. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_*).'
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore?.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        if (!cookieStore) return
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        if (!cookieStore) return
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}