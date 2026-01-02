import { getSupabaseClient } from '@/lib/supabase-client'

/**
 * Demo seeding helper.
 * Safe for build: function is defined, Supabase client is only created when called at runtime.
 */
export async function createDemoContent() {
  const supabase = getSupabaseClient()

  // TODO: Add real demo inserts when you finalize DB schema.
  // For now we only validate that Supabase client can be initialized at runtime.
  void supabase

  return { success: true }
}
