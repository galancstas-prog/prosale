'use server'

import { supabase } from '@/lib/supabase-client'

export async function createFaqItem(formData: FormData) {
  const question = formData.get('question') as string
  const answer = formData.get('answer') as string

  if (!question || !answer) {
    return { error: 'Question and answer are required' }
  }

  const { count } = await supabase
    .from('faq_items')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('faq_items')
    .insert({
      question,
      answer,
      order_index: (count || 0) + 1,
    })
    .select()
    .single()

  if (error) {
    console.error('[FAQ create]', error)
    return { error: error?.message ?? JSON.stringify(error) }
  }

  return { data }
}

export async function getFaqItems() {
  const { data, error } = await supabase
    .from('faq_items')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching FAQ items:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function deleteFaqItem(itemId: string) {
  const { error } = await supabase
    .from('faq_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('[FAQ delete]', error)
    return { error: error?.message ?? JSON.stringify(error) }
  }

  return { success: true }
}
