'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getFaqItems() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createFaqItem(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const question = (formData.get('question') as string)?.trim()
  const answer = (formData.get('answer') as string)?.trim()

  if (!question || !answer) return { error: 'Question and answer are required' }

  const { data, error } = await supabase
    .from('faq_items')
    .insert({ question, answer })
    .select('*')
    .single()

  if (error) return { error: error.message }

  safeRevalidatePath('/app/faq')
  return { data }
}

export async function deleteFaqItem(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from('faq_items').delete().eq('id', id)
  if (error) return { error: error.message }

  safeRevalidatePath('/app/faq')
  return { success: true }
}