'use server'

const mockTrainingCategories: any[] = []

export async function createTrainingCategory(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) {
    return { error: 'Category name is required' }
  }

  const data = {
    id: Math.random().toString(36).substring(7),
    name,
    description,
    type: 'training',
    created_at: new Date().toISOString(),
  }

  mockTrainingCategories.push(data)
  return { data }
}

export async function getTrainingCategories() {
  return { data: mockTrainingCategories }
}

export async function deleteTrainingCategory(categoryId: string) {
  const index = mockTrainingCategories.findIndex(cat => cat.id === categoryId)
  if (index > -1) {
    mockTrainingCategories.splice(index, 1)
  }
  return { success: true }
}
