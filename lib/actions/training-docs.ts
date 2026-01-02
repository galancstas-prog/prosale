'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim() || ''

  if (!title) return { error: 'Title is required' }
  if (!categoryId) return { error: 'Category is required' }

  // В SQL: content_richtext NOT NULL
  const { data, error } = await supabase
    .from('training_docs')
    .insert({
      category_id: categoryId,
      title,
      content,
      content_richtext: content,
      is_published: true,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/app/training')
  return { data }
}

export async function deleteTrainingDoc(id: string) {
  const supabase = getSupabaseServerClient()

  const { error } = await supabase.from('training_docs').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/app/training')
  return { success: true }
}