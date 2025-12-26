'use server'

import { revalidatePath } from 'next/cache'

const mockTurns: any[] = []

export async function createTurn(threadId: string, formData: FormData) {
  const speaker = formData.get('speaker') as string
  const content = formData.get('content') as string

  if (!speaker || !content) {
    return { error: 'Speaker and content are required' }
  }

  if (speaker !== 'agent' && speaker !== 'client') {
    return { error: 'Invalid speaker type' }
  }

  const threadTurns = mockTurns.filter(t => t.thread_id === threadId)
  const turnOrder = threadTurns.length > 0
    ? Math.max(...threadTurns.map(t => t.turn_order)) + 1
    : 1

  const data = {
    id: Math.random().toString(36).substring(7),
    thread_id: threadId,
    turn_order: turnOrder,
    speaker,
    content,
    created_at: new Date().toISOString(),
  }

  mockTurns.push(data)
  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { data }
}

export async function getTurnsByThread(threadId: string) {
  const turns = mockTurns
    .filter(t => t.thread_id === threadId)
    .sort((a, b) => a.turn_order - b.turn_order)
  return { data: turns }
}

export async function updateTurn(turnId: string, content: string) {
  const turn = mockTurns.find(t => t.id === turnId)
  if (turn) {
    turn.content = content
    revalidatePath(`/app/scripts/thread/${turn.thread_id}`)
  }
  return { success: true }
}

export async function deleteTurn(turnId: string, threadId: string) {
  const index = mockTurns.findIndex(t => t.id === turnId)
  if (index > -1) {
    mockTurns.splice(index, 1)
  }
  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { success: true }
}

export async function reorderTurn(turnId: string, threadId: string, direction: 'up' | 'down') {
  const turn = mockTurns.find(t => t.id === turnId)
  if (!turn) {
    return { error: 'Turn not found' }
  }

  const newOrder = direction === 'up' ? turn.turn_order - 1 : turn.turn_order + 1
  const swapTurn = mockTurns.find(t => t.thread_id === threadId && t.turn_order === newOrder)

  if (!swapTurn) {
    return { error: 'Cannot move in that direction' }
  }

  const tempOrder = turn.turn_order
  turn.turn_order = swapTurn.turn_order
  swapTurn.turn_order = tempOrder

  revalidatePath(`/app/scripts/thread/${threadId}`)
  return { success: true }
}
