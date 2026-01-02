import { getSupabaseClient } from '@/lib/supabase-client'
export async function createThread(categoryId: string, formData: FormData) {
  const supabase = getSupabaseClient()

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title) {
    return { error: 'Thread title is required' }
  }

  const { data, error } = await supabase
    .from('script_threads')
    .insert({
      category_id: categoryId,
      title,
      description,
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating thread:', error)
    return { error: 'Failed to create thread' }
  }

  return { data }
}

export async function getThreadsByCategory(categoryId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching threads:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function getThreadById(threadId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('script_threads')
    .select('*, categories(*)')
    .eq('id', threadId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching thread:', error)
    return { error: 'Thread not found' }
  }

  if (!data) {
    return { error: 'Thread not found' }
  }

  return { data }
}

export async function deleteThread(threadId: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('script_threads')
    .delete()
    .eq('id', threadId)

  if (error) {
    console.error('Error deleting thread:', error)
    return { error: 'Failed to delete thread' }
  }

  return { success: true }
}