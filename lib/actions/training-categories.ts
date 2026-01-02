'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function createTrainingCategory(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = String(formData.get('name') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!name) return { error: 'Category name is required' }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description, type: 'training' })
    .select('*')
    .single()

  if (error) {
    console.error('[createTrainingCategory]', error)
    return { error: error.message || 'Failed to create training category' }
  }

  revalidatePath('/app/training')
  return { data }
}

export async function getTrainingCategories() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'training')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getTrainingCategories]', error)
    return { data: [] as any[] }
  }

  return { data: data || [] }
}

export async function deleteTrainingCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  if (!categoryId) return { error: 'Missing category id' }

  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) {
    console.error('[deleteTrainingCategory]', error)
    return { error: error.message || 'Failed to delete training category' }
  }

  revalidatePath('/app/training')
  return { success: true }
}