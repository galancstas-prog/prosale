'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { revalidatePath } from 'next/cache'

export async function createThread(categoryId: string, formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title) {
    return { error: 'Thread title is required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('script_threads')
    .insert({
      tenant_id: user.appUser.tenant_id,
      category_id: categoryId,
      title,
      description,
      is_published: true,
      created_by: user.appUser.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/scripts/${categoryId}`)
  return { data }
}

export async function getThreadsByCategory(categoryId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getThreadById(threadId: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*, categories(*)')
    .eq('id', threadId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function deleteThread(threadId: string) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { data: thread } = await supabase
    .from('script_threads')
    .select('category_id')
    .eq('id', threadId)
    .single()

  const { error } = await supabase
    .from('script_threads')
    .delete()
    .eq('id', threadId)
    .eq('tenant_id', user.appUser.tenant_id)

  if (error) {
    return { error: error.message }
  }

  if (thread?.category_id) {
    revalidatePath(`/app/scripts/${thread.category_id}`)
  }
  return { success: true }
}
