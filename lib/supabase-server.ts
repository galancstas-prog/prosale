import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  // В Bolt/preview и при некоторых предрендерах cookies() может быть недоступен.
  // Тогда Next кидает:
  // "Invariant: cookies() expects to have requestAsyncStorage, none available."
  // Поэтому делаем safe guard: не падаем приложением.
  let cookieStore: ReturnType<typeof cookies> | null = null

  try {
    cookieStore = cookies()
  } catch {
    cookieStore = null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
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