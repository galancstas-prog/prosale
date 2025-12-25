'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/user'
import { revalidatePath } from 'next/cache'

export async function createCategory(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const type = 'script'

  if (!name) {
    return { error: 'Category name is required' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      tenant_id: user.appUser.tenant_id,
      name,
      description,
      type,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/scripts')
  return { data }
}

export async function getCategories() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('type', 'script')
    .order('created_at', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function deleteCategory(categoryId: string) {
  const user = await getCurrentUser()

  if (!user || user.appUser.role !== 'ADMIN') {
    return { error: 'Unauthorized: Admin access required' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('tenant_id', user.appUser.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/scripts')
  return { success: true }
}
