const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  const cleanText = text.replace(/\s+/g, ' ').trim()

  if (cleanText.length <= chunkSize) {
    return [cleanText]
  }

  let start = 0
  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length)
    const chunk = cleanText.substring(start, end)
    chunks.push(chunk)

    if (end >= cleanText.length) break
    start = end - overlap
  }

  return chunks
}
