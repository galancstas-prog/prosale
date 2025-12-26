'use server'

import { revalidatePath } from 'next/cache'

const mockProgress: any[] = []

export async function getMyProgress(docId: string) {
  const progress = mockProgress.find(p => p.doc_id === docId)
  return { data: progress || null }
}

export async function markDocInProgress(docId: string) {
  const existing = mockProgress.find(p => p.doc_id === docId)
  if (existing) {
    return { data: existing }
  }

  const data = {
    id: Math.random().toString(36).substring(7),
    doc_id: docId,
    progress_percent: 0,
    last_accessed_at: new Date().toISOString(),
  }

  mockProgress.push(data)
  revalidatePath(`/app/training/doc/${docId}`)
  return { data }
}

export async function markDocCompleted(docId: string) {
  const existing = mockProgress.find(p => p.doc_id === docId)

  if (existing) {
    existing.progress_percent = 100
    existing.completed_at = new Date().toISOString()
    existing.last_accessed_at = new Date().toISOString()
  } else {
    mockProgress.push({
      id: Math.random().toString(36).substring(7),
      doc_id: docId,
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    })
  }

  revalidatePath(`/app/training/doc/${docId}`)
  revalidatePath('/app/admin/progress')
  return { success: true }
}

export async function getAllProgress() {
  return { data: [] }
}
