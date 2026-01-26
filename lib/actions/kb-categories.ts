'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'

export async function getKbCategories() {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'kb')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getKbCategories]', error)
    return { data: [] as any[] }
  }

  return { data: data || [] }
}

export async function createKbCategory(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = String(formData.get('name') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!name) return { error: 'Category name is required' }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description, type: 'kb' })
    .select('*')
    .single()

  if (error) {
    console.error('[createKbCategory]', error)
    return { error: error.message || 'Failed to create KB category' }
  }

  safeRevalidatePath('/app/knowledge')
  return { data }
}

export async function updateKbCategory(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = String(formData.get('name') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!categoryId) return { error: 'Missing category id' }
  if (!name) return { error: 'Category name is required' }

  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', categoryId)
    .eq('type', 'kb')
    .select('*')
    .single()

  if (error) {
    console.error('[updateKbCategory]', error)
    return { error: error.message || 'Failed to update KB category' }
  }

  safeRevalidatePath('/app/knowledge')
  return { data }
}

export async function deleteKbCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  if (!categoryId) return { error: 'Missing category id' }

  // Проверяем, есть ли страницы в этой категории
  const { data: pages, error: checkError } = await supabase
    .from('kb_pages')
    .select('id')
    .eq('category_id', categoryId)
    .limit(1)

  if (checkError) {
    console.error('[deleteKbCategory] Check error:', checkError)
    return { error: checkError.message || 'Failed to check category usage' }
  }

  if (pages && pages.length > 0) {
    return { error: 'Нельзя удалить: есть статьи в категории' }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('type', 'kb')

  if (error) {
    console.error('[deleteKbCategory]', error)
    return { error: error.message || 'Failed to delete KB category' }
  }

  safeRevalidatePath('/app/knowledge')
  return { success: true }
}
