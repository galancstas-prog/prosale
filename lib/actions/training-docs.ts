import { getSupabaseClient } from '@/lib/supabase-client'
export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const supabase = getSupabaseClient()

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const { data, error } = await supabase
    .from('training_docs')
    .insert({
      category_id: categoryId,
      title,
      content: '',
      content_richtext: content,
      is_published: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating training doc:', error)
    return { error: 'Failed to create training document' }
  }

  return { data }
}

export async function getTrainingDocsByCategory(categoryId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching training docs:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function getTrainingDocById(docId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('training_docs')
    .select('*, categories(*)')
    .eq('id', docId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching training doc:', error)
    return { error: 'Document not found' }
  }

  if (!data) {
    return { error: 'Document not found' }
  }

  return { data }
}

export async function updateTrainingDoc(docId: string, content: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('training_docs')
    .update({ content_richtext: content })
    .eq('id', docId)

  if (error) {
    console.error('Error updating training doc:', error)
    return { error: 'Failed to update document' }
  }

  return { success: true }
}

export async function deleteTrainingDoc(docId: string, categoryId: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('training_docs')
    .delete()
    .eq('id', docId)

  if (error) {
    console.error('Error deleting training doc:', error)
    return { error: 'Failed to delete document' }
  }

  return { success: true }
}

export async function uploadTrainingImage(formData: FormData) {
  const supabase = getSupabaseClient()

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  return { url: 'https://via.placeholder.com/800x600' }
}
