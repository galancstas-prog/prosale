import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseServerClient() {
  // В некоторых окружениях (Bolt/предрендер) cookies() может быть недоступен
  // и тогда Next падает с:
  // "cookies() expects to have requestAsyncStorage, none available."
  // Поэтому делаем safe-fallback.
  let cookieStore: ReturnType<typeof cookies> | null = null

  try {
    cookieStore = cookies()
  } catch (e) {
    cookieStore = null
  }

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''

  if (!url || !anonKey) {
    throw new Error(
      'Missing env vars for Supabase server client. Set SUPABASE_URL + SUPABASE_ANON_KEY (or NEXT_PUBLIC_*).'
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        // Если cookies недоступны — просто считаем, что их нет
        return cookieStore?.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        // Если cookies недоступны — не падаем
        if (!cookieStore) return
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        // Если cookies недоступны — не падаем
        if (!cookieStore) return
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}