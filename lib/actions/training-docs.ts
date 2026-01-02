'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

const TRAINING_BUCKET = 'training-images'

export async function getTrainingDocsByCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('id,title,content_richtext,category_id,created_at,updated_at,is_published')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function getTrainingDocById(docId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*')
    .eq('id', docId)
    .single()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim() || ''

  if (!title) return { error: 'Title is required' }
  if (!categoryId) return { error: 'Category is required' }

  const { data, error } = await supabase
    .from('training_docs')
    .insert({
      category_id: categoryId,
      title,
      content,
      content_richtext: content, // NOT NULL
      is_published: true,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/app/training/${categoryId}`)
  revalidatePath('/app/training')
  return { data }
}

export async function updateTrainingDoc(docId: string, content_richtext: string) {
  const supabase = await getSupabaseServerClient()

  const content = (content_richtext || '').trim()
  if (!content) return { error: 'Content cannot be empty' }

  const { data, error } = await supabase
    .from('training_docs')
    .update({
      content: content, // keep both in sync for now
      content_richtext: content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', docId)
    .select('*')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/app/training/doc/${docId}`)
  return { data }
}

export async function deleteTrainingDoc(id: string) {
  const supabase = await getSupabaseServerClient()

  // нужно получить category_id для revalidatePath
  const { data: doc } = await supabase
    .from('training_docs')
    .select('category_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('training_docs').delete().eq('id', id)
  if (error) return { error: error.message }

  if (doc?.category_id) revalidatePath(`/app/training/${doc.category_id}`)
  revalidatePath('/app/training')
  return { success: true }
}

export async function uploadTrainingImage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  // Простая валидация
  if (!file.type.startsWith('image/')) return { error: 'Only images allowed' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Max file size is 5MB' }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${randomUUID()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(TRAINING_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from(TRAINING_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}