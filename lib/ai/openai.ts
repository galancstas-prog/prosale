const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'
const OPENAI_CHAT_MODEL = 'gpt-4o-mini'

async function readOpenAIError(response: Response): Promise<never> {
  let details = ''
  try {
    const json = await response.json()
    details = JSON.stringify(json)
  } catch {
    details = await response.text()
  }
  throw new Error(`OpenAI API error ${response.status}: ${details}`)
}

/**
 * SINGLE embedding (оставляем для aiSearch — там 1 запрос, это нормально)
 */
export async function createEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  })

  if (!response.ok) {
    await readOpenAIError(response)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * BATCH embeddings (НОВОЕ — только для индексации)
 */
export async function createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  if (texts.length === 0) return []

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: texts,
    }),
  })

  if (!response.ok) {
    await readOpenAIError(response)
  }

  const data = await response.json()
  return data.data.map((d: any) => d.embedding)
}

export async function createChatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number
    max_tokens?: number
  }
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 800,
    }),
  })

  if (!response.ok) {
    await readOpenAIError(response)
  }

  const data = await response.json()
  return data.choices[0].message.content
}