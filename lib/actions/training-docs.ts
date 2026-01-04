'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { safeRevalidatePath } from '@/lib/safe-revalidate'
import { randomUUID } from 'crypto'

const TRAINING_BUCKET = 'training-images'

export async function getTrainingDocsByCategory(categoryId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_docs')
    // updated_at в таблице НЕТ — поэтому НЕ выбираем его
    .select('id,title,content_richtext,category_id,created_at,is_published')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getTrainingDocsByCategory] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getTrainingDocById(docId: string) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*')
    .eq('id', docId)
    .single()

  if (error) {
    console.error('[getTrainingDocById] Database error:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim() || ''

  if (!title) return { error: 'Title is required' }
  if (!categoryId) return { error: 'Category is required' }
  if (!content) return { error: 'Content is required' }

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

  if (error) {
    console.error('[createTrainingDoc] Database error:', error)
    return { error: `Database error: ${error.message}` }
  }

  safeRevalidatePath(`/app/training/${categoryId}`)
  safeRevalidatePath('/app/training')
  return { data }
}

export async function updateTrainingDoc(docId: string, content_richtext: string) {
  const supabase = await getSupabaseServerClient()

  const content = (content_richtext || '').trim()
  if (!content) return { error: 'Content cannot be empty' }

  // updated_at в таблице НЕТ — поэтому НЕ обновляем его
  const { data, error } = await supabase
    .from('training_docs')
    .update({
      content, // держим обе колонки синхронно
      content_richtext: content,
    })
    .eq('id', docId)
    .select('*')
    .single()

  if (error) {
    console.error('[updateTrainingDoc] Database error:', error)
    return { error: error.message }
  }

  safeRevalidatePath(`/app/training/doc/${docId}`)
  return { data }
}

export async function deleteTrainingDoc(id: string) {
  const supabase = await getSupabaseServerClient()

  const { data: doc, error: fetchError } = await supabase
    .from('training_docs')
    .select('category_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('[deleteTrainingDoc] Fetch doc error:', fetchError)
    // даже если не нашли — пробуем удалить
  }

  const { error } = await supabase.from('training_docs').delete().eq('id', id)
  if (error) {
    console.error('[deleteTrainingDoc] Delete error:', error)
    return { error: error.message }
  }

  if (doc?.category_id) safeRevalidatePath(`/app/training/${doc.category_id}`)
  safeRevalidatePath('/app/training')
  return { success: true }
}

export async function uploadTrainingImage(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

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

  if (uploadError) {
    console.error('[uploadTrainingImage] Upload error:', uploadError)
    return { error: uploadError.message }
  }

  const { data } = supabase.storage.from(TRAINING_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}