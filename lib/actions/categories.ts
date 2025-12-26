'use server'

import { revalidatePath } from 'next/cache'

// Mock data store
const mockCategories: any[] = []

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const type = 'script'

  if (!name) {
    return { error: 'Category name is required' }
  }

  const data = {
    id: Math.random().toString(36).substring(7),
    name,
    description,
    type,
    created_at: new Date().toISOString(),
  }

  mockCategories.push(data)
  revalidatePath('/app/scripts')
  return { data }
}

export async function getCategories() {
  return { data: mockCategories }
}

export async function deleteCategory(categoryId: string) {
  const index = mockCategories.findIndex(cat => cat.id === categoryId)
  if (index > -1) {
    mockCategories.splice(index, 1)
  }
  revalidatePath('/app/scripts')
  return { success: true }
}
