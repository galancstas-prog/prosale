import { getSupabaseClient } from '@/lib/supabase-client'
export async function createCategory(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const type = 'script'

  if (!name) {
    return { error: 'Category name is required' }
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      description,
      type,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return { error: 'Failed to create category' }
  }

  return { data }
}

export async function getCategories() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'script')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching categories:', error)
    return { data: [] }
  }

  return { data: data || [] }
}

export async function deleteCategory(categoryId: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting category:', error)
    return { error: 'Failed to delete category' }
  }

  return { success: true }
}
