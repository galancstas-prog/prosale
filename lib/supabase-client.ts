import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  browserClient = createBrowserClient(url, anonKey, {
    auth: {
      // ✅ Отключаем автоматическое обновление токена при возврате фокуса на страницу
      // Это предотвращает нежелательные события TOKEN_REFRESHED и перезагрузку UI
      // Токен всё равно будет обновляться по истечении, но не при каждом возврате на вкладку
      autoRefreshToken: true, // Оставляем true для обновления по истечении
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  
  return browserClient
}