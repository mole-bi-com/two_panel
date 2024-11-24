export function splitIntoChunks(text: string): string[] {
  // 단락을 기준으로 텍스트 분할
  const paragraphs = text.split(/\n\s*\n/)
  const chunks: string[] = []
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    // 청크 크기가 약 4000자를 넘지 않도록 관리
    if ((currentChunk + paragraph).length > 4000) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
} 