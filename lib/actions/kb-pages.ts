'use server'

const mockKbPages: any[] = []

export async function createKbPage(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const data = {
    id: Math.random().toString(36).substring(7),
    title,
    content_richtext: content,
    created_at: new Date().toISOString(),
  }

  mockKbPages.push(data)
  return { data }
}

export async function getKbPages() {
  return { data: [...mockKbPages].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ) }
}

export async function getKbPageById(pageId: string) {
  const page = mockKbPages.find(p => p.id === pageId)
  if (!page) {
    return { error: 'Page not found' }
  }
  return { data: page }
}

export async function updateKbPage(pageId: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const page = mockKbPages.find(p => p.id === pageId)
  if (!page) {
    return { error: 'Page not found' }
  }

  page.title = title
  page.content_richtext = content
  return { data: page }
}

export async function deleteKbPage(pageId: string) {
  const index = mockKbPages.findIndex(p => p.id === pageId)
  if (index > -1) {
    mockKbPages.splice(index, 1)
  }
  return { success: true }
}
