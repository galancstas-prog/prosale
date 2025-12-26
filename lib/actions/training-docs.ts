'use server'

import { revalidatePath } from 'next/cache'

const mockDocs: any[] = []

export async function createTrainingDoc(categoryId: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const data = {
    id: Math.random().toString(36).substring(7),
    category_id: categoryId,
    title,
    content: '',
    content_richtext: content,
    is_published: true,
    created_at: new Date().toISOString(),
  }

  mockDocs.push(data)
  revalidatePath(`/app/training/${categoryId}`)
  return { data }
}

export async function getTrainingDocsByCategory(categoryId: string) {
  return { data: mockDocs.filter(d => d.category_id === categoryId) }
}

export async function getTrainingDocById(docId: string) {
  const doc = mockDocs.find(d => d.id === docId)
  if (!doc) {
    return { error: 'Document not found' }
  }
  return { data: { ...doc, categories: {} } }
}

export async function updateTrainingDoc(docId: string, content: string) {
  const doc = mockDocs.find(d => d.id === docId)
  if (doc) {
    doc.content_richtext = content
    revalidatePath(`/app/training/${doc.category_id}`)
    revalidatePath(`/app/training/doc/${docId}`)
  }
  return { success: true }
}

export async function deleteTrainingDoc(docId: string, categoryId: string) {
  const index = mockDocs.findIndex(d => d.id === docId)
  if (index > -1) {
    mockDocs.splice(index, 1)
  }
  revalidatePath(`/app/training/${categoryId}`)
  return { success: true }
}

export async function uploadTrainingImage(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  return { url: 'https://via.placeholder.com/800x600' }
}
