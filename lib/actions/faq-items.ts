'use server'

const mockFaqItems: any[] = []

export async function createFaqItem(formData: FormData) {
  const question = formData.get('question') as string
  const answer = formData.get('answer') as string

  if (!question || !answer) {
    return { error: 'Question and answer are required' }
  }

  const existingItems = mockFaqItems.length
  const data = {
    id: Math.random().toString(36).substring(7),
    question,
    answer,
    order_index: existingItems + 1,
    created_at: new Date().toISOString(),
  }

  mockFaqItems.push(data)
  return { data }
}

export async function getFaqItems() {
  const sortedItems = [...mockFaqItems].sort((a, b) => a.order_index - b.order_index)
  return { data: sortedItems }
}

export async function deleteFaqItem(itemId: string) {
  const index = mockFaqItems.findIndex(item => item.id === itemId)
  if (index > -1) {
    mockFaqItems.splice(index, 1)
  }
  return { success: true }
}
