'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function createCategory(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = String(formData.get('name') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!name) return { error: 'Category name is required' }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description, type: 'script' })
    .select('*')
    .single()

  if (error) {
    console.error('[createCategory]', error)
    return { error: error.message || 'Failed to create category' }
  }

  revalidatePath('/app/scripts')
  return { data }
}

export async function getCategories() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'script')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getCategories]', error)
    return { data: [] as any[] }
  }

  return { data: data || [] }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  if (!categoryId) return { error: 'Missing category id' }

  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) {
    console.error('[deleteCategory]', error)
    return { error: error.message || 'Failed to delete category' }
  }

  revalidatePath('/app/scripts')
  return { success: true }
}