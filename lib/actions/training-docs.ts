'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { revalidatePath } from 'next/cache'

export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('training_docs')
    .insert({
      tenant_id: user.appUser.tenant_id,
      category_id: categoryId,
      title,
      content: '',
      content_richtext: content,
      is_published: true,
      created_by: user.appUser.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/training/${categoryId}`)
  return { data }
}

export async function getTrainingDocsByCategory(categoryId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getTrainingDocById(docId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*, categories(*)')
    .eq('id', docId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function updateTrainingDoc(docId: string, content: string) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('training_docs')
    .select('category_id')
    .eq('id', docId)
    .single()

  const { error } = await supabase
    .from('training_docs')
    .update({ content_richtext: content })
    .eq('id', docId)
    .eq('tenant_id', user.appUser.tenant_id)

  if (error) {
    return { error: error.message }
  }

  if (doc?.category_id) {
    revalidatePath(`/app/training/${doc.category_id}`)
  }
  revalidatePath(`/app/training/doc/${docId}`)
  return { success: true }
}

export async function deleteTrainingDoc(docId: string, categoryId: string) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('training_docs')
    .delete()
    .eq('id', docId)
    .eq('tenant_id', user.appUser.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/training/${categoryId}`)
  return { success: true }
}

export async function uploadTrainingImage(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const file = formData.get('file') as File

  if (!file) {
    return { error: 'No file provided' }
  }

  const supabase = await createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.appUser.tenant_id}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('training-assets')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return { error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('training-assets')
    .getPublicUrl(data.path)

  return { url: publicUrl }
}
