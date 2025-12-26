'use server'

const mockThreads: any[] = []

export async function createThread(categoryId: string, formData: FormData) {
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!title) {
    return { error: 'Thread title is required' }
  }

  const data = {
    id: Math.random().toString(36).substring(7),
    category_id: categoryId,
    title,
    description,
    is_published: true,
    created_at: new Date().toISOString(),
  }

  mockThreads.push(data)
  return { data }
}

export async function getThreadsByCategory(categoryId: string) {
  return { data: mockThreads.filter(t => t.category_id === categoryId) }
}

export async function getThreadById(threadId: string) {
  const thread = mockThreads.find(t => t.id === threadId)
  if (!thread) {
    return { error: 'Thread not found' }
  }
  return { data: { ...thread, categories: {} } }
}

export async function deleteThread(threadId: string) {
  const index = mockThreads.findIndex(t => t.id === threadId)
  if (index > -1) {
    mockThreads.splice(index, 1)
  }
  return { success: true }
}
