import { encode } from 'gpt-tokenizer'

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  timeMarker?: string; // "(00:00)" 형식의 시간 마커
}

export function splitIntoChunks(text: string, maxTokens: number = 8000): Chunk[] {
  // 시간 마커를 포함한 문단 분할을 위한 정규식
  const timeMarkerRegex = /\((\d{2}:\d{2})\)/;
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  const chunks: Chunk[] = [];
  let currentChunk: string[] = [];
  let currentTokenCount = 0;
  let chunkId = 0;
  let currentTimeMarker = '';

  for (const paragraph of paragraphs) {
    // 시간 마커 확인
    const timeMatch = paragraph.match(timeMarkerRegex);
    if (timeMatch) {
      currentTimeMarker = timeMatch[0];
    }

    const paragraphTokens = encode(paragraph).length;
    
    // 현재 청크가 최대 토큰 수를 초과하는 경우
    if (currentTokenCount + paragraphTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push({
          id: chunkId++,
          text: currentChunk.join('\n\n'),
          tokens: currentTokenCount,
          timeMarker: currentTimeMarker
        });
        currentChunk = [];
        currentTokenCount = 0;
      }

      // 단일 문단이 최대 토큰 수를 초과하는 경우
      if (paragraphTokens > maxTokens) {
        const sentences = paragraph
          .split(/(?<=\.|\?|\!)\s+/)
          .filter(s => s.trim());
        
        let sentenceChunk: string[] = [];
        let sentenceTokenCount = 0;

        for (const sentence of sentences) {
          const sentenceTokens = encode(sentence).length;

          if (sentenceTokenCount + sentenceTokens > maxTokens) {
            if (sentenceChunk.length > 0) {
              chunks.push({
                id: chunkId++,
                text: sentenceChunk.join(' '),
                tokens: sentenceTokenCount,
                timeMarker: currentTimeMarker
              });
              sentenceChunk = [];
              sentenceTokenCount = 0;
            }
          }

          sentenceChunk.push(sentence);
          sentenceTokenCount += sentenceTokens;
        }

        if (sentenceChunk.length > 0) {
          chunks.push({
            id: chunkId++,
            text: sentenceChunk.join(' '),
            tokens: sentenceTokenCount,
            timeMarker: currentTimeMarker
          });
        }
      } else {
        currentChunk = [paragraph];
        currentTokenCount = paragraphTokens;
      }
    } else {
      currentChunk.push(paragraph);
      currentTokenCount += paragraphTokens;
    }
  }

  // 마지막 청크 추가
  if (currentChunk.length > 0) {
    chunks.push({
      id: chunkId,
      text: currentChunk.join('\n\n'),
      tokens: currentTokenCount,
      timeMarker: currentTimeMarker
    });
  }

  // 디버깅을 위한 로그
  console.log('Created chunks:', chunks.map(c => ({
    id: c.id,
    tokens: c.tokens,
    timeMarker: c.timeMarker,
    preview: c.text.substring(0, 50) + '...'
  })));

  return chunks;
} 