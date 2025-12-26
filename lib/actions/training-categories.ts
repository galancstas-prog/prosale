'use server'

import { supabase } from '@/lib/supabase-client'

export async function createTrainingCategory(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) {
    return { error: 'Category name is required' }
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      description,
      type: 'training',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating training category:', error)
    return { error: 'Failed to create category' }
  }

  return { data }
}

export async function getTrainingCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'training')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching training categories:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function deleteTrainingCategory(categoryId: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting training category:', error)
    return { error: 'Failed to delete category' }
  }

  return { success: true }
}
