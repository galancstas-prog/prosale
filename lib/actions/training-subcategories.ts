'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface TrainingSubcategory {
  id: string
  category_id: string
  name: string
  description: string | null
  order_index: number
  created_at: string
}

export async function getTrainingSubcategories(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getTrainingSubcategories]', error)
    return { data: [] as TrainingSubcategory[] }
  }

  return { data: (data || []) as TrainingSubcategory[] }
}

export async function getTrainingSubcategoryById(subcategoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_subcategories')
    .select('*')
    .eq('id', subcategoryId)
    .single()

  if (error) {
    console.error('[getTrainingSubcategoryById]', error)
    return { error: error.message, data: null }
  }

  return { data: data as TrainingSubcategory, error: null }
}

export async function createTrainingSubcategory(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = String(formData.get('name') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!name) return { error: 'Название подкатегории обязательно' }
  if (!categoryId) return { error: 'Категория не указана' }

  // Получаем максимальный order_index для этой категории
  const { data: existing } = await supabase
    .from('training_subcategories')
    .select('order_index')
    .eq('category_id', categoryId)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextOrder = existing && existing.length > 0 ? (existing[0].order_index || 0) + 1 : 0

  const { data, error } = await supabase
    .from('training_subcategories')
    .insert({ 
      category_id: categoryId, 
      name, 
      description,
      order_index: nextOrder
    })
    .select('*')
    .single()

  if (error) {
    console.error('[createTrainingSubcategory]', error)
    return { error: error.message || 'Не удалось создать подкатегорию' }
  }

  return { data }
}

export async function updateTrainingSubcategory(subcategoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = String(formData.get('name') || '').trim()
  const descriptionRaw = formData.get('description')
  const description = descriptionRaw ? String(descriptionRaw).trim() : null

  if (!subcategoryId) return { error: 'ID подкатегории не указан' }
  if (!name) return { error: 'Название подкатегории обязательно' }

  const { data, error } = await supabase
    .from('training_subcategories')
    .update({ name, description })
    .eq('id', subcategoryId)
    .select('*')
    .single()

  if (error) {
    console.error('[updateTrainingSubcategory]', error)
    return { error: error.message || 'Не удалось обновить подкатегорию' }
  }

  return { data }
}

export async function deleteTrainingSubcategory(subcategoryId: string) {
  const supabase = await getSupabaseServerClient()

  if (!subcategoryId) return { error: 'ID подкатегории не указан' }

  const { error } = await supabase
    .from('training_subcategories')
    .delete()
    .eq('id', subcategoryId)

  if (error) {
    console.error('[deleteTrainingSubcategory]', error)
    return { error: error.message || 'Не удалось удалить подкатегорию' }
  }

  return { success: true }
}
