const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 200

function normalize(text: string) {
  return (text || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const clean = normalize(text)
  if (!clean) return []
  if (clean.length <= chunkSize) return [clean]

  // 1) режем по блокам (абзацы/разделители)
  const blocks = clean
    .split(/\n{2,}/g)
    .map((b) => b.trim())
    .filter(Boolean)

  // 2) склеиваем блоки до лимита
  const chunks: string[] = []
  let buf = ''

  for (const b of blocks) {
    const candidate = buf ? `${buf}\n\n${b}` : b

    if (candidate.length <= chunkSize) {
      buf = candidate
      continue
    }

    if (buf) {
      chunks.push(buf)
      buf = ''
    }

    // если один блок огромный — режем его по длине с overlap
    if (b.length > chunkSize) {
      let start = 0
      while (start < b.length) {
        const end = Math.min(start + chunkSize, b.length)
        chunks.push(b.substring(start, end))
        if (end >= b.length) break
        start = end - overlap
      }
    } else {
      buf = b
    }
  }

  if (buf) chunks.push(buf)

  // 3) мягкий overlap между чанками (чтобы контекст не “обрывался”)
  if (overlap > 0 && chunks.length > 1) {
    const out: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      if (i === 0) {
        out.push(chunks[i])
        continue
      }
      const prev = chunks[i - 1]
      const head = prev.slice(Math.max(0, prev.length - overlap))
      out.push(`${head}\n\n${chunks[i]}`.slice(0, chunkSize))
    }
    return out
  }

  return chunks
}