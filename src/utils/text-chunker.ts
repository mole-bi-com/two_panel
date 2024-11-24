import { encode } from 'gpt-tokenizer'

interface SubChunk {
  id: number;
  text: string;
  timeMarker?: string;
  translation?: string;
}

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  subChunks: SubChunk[];
}

// 시간 마커를 포함한 문장 단위로 텍스트 분할
function splitByTimeMarkers(text: string): string[] {
  const timeMarkerPattern = /\(\d{2}:\d{2}\)/;
  return text
    .split(/(?=\(\d{2}:\d{2}\))/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

// 청크를 4개의 서브청크로 분할
function splitChunkIntoSubChunks(chunkText: string): SubChunk[] {
  const parts = splitByTimeMarkers(chunkText);
  const subChunks: SubChunk[] = [];
  
  // 전체 텍스트 길이 계산
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const targetLength = Math.ceil(totalLength / 4);
  
  let currentSubChunk = '';
  let currentLength = 0;
  let subChunkId = 0;

  for (const part of parts) {
    const timeMarker = part.match(/\(\d{2}:\d{2}\)/)?.[0];
    
    if (currentLength + part.length > targetLength && currentSubChunk) {
      // 현재 서브청크가 목표 길이에 도달하면 저장
      subChunks.push({
        id: subChunkId++,
        text: currentSubChunk.trim(),
        timeMarker: currentSubChunk.match(/\(\d{2}:\d{2}\)/)?.[0]
      });
      currentSubChunk = part;
      currentLength = part.length;
    } else {
      // 아직 목표 길이에 도달하지 않았으면 계속 추가
      currentSubChunk += (currentSubChunk ? ' ' : '') + part;
      currentLength += part.length;
    }
  }

  // 마지막 서브청크 처리
  if (currentSubChunk) {
    subChunks.push({
      id: subChunkId,
      text: currentSubChunk.trim(),
      timeMarker: currentSubChunk.match(/\(\d{2}:\d{2}\)/)?.[0]
    });
  }

  // 서브청크가 4개보다 적으면 남은 부분을 균등하게 분배
  while (subChunks.length < 4) {
    // 가장 긴 서브청크를 찾아서 분할
    const longestIndex = subChunks
      .map((chunk, index) => ({ index, length: chunk.text.length }))
      .reduce((a, b) => a.length > b.length ? a : b)
      .index;
    
    const chunkToSplit = subChunks[longestIndex];
    const splitPoint = Math.ceil(chunkToSplit.text.length / 2);
    
    const firstHalf = chunkToSplit.text.slice(0, splitPoint);
    const secondHalf = chunkToSplit.text.slice(splitPoint);
    
    subChunks.splice(longestIndex, 1,
      {
        id: chunkToSplit.id,
        text: firstHalf.trim(),
        timeMarker: firstHalf.match(/\(\d{2}:\d{2}\)/)?.[0]
      },
      {
        id: subChunks.length,
        text: secondHalf.trim(),
        timeMarker: secondHalf.match(/\(\d{2}:\d{2}\)/)?.[0]
      }
    );
  }

  // 정확히 4개의 서브청크만 반환
  return subChunks.slice(0, 4);
}

export function splitIntoChunks(text: string, maxTokens: number = 8000): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentTokenCount = 0;
  let chunkId = 0;

  // 줄 단위로 분리
  const lines = text.split('\n');

  for (const line of lines) {
    const lineTokens = encode(line).length;
    
    if (currentTokenCount + lineTokens > maxTokens) {
      if (currentChunk) {
        chunks.push({
          id: chunkId++,
          text: currentChunk.trim(),
          tokens: currentTokenCount,
          subChunks: splitChunkIntoSubChunks(currentChunk)
        });
        currentChunk = '';
        currentTokenCount = 0;
      }
    }
    
    currentChunk += line + '\n';
    currentTokenCount += lineTokens;
  }

  // 마지막 청크 추가
  if (currentChunk) {
    chunks.push({
      id: chunkId,
      text: currentChunk.trim(),
      tokens: currentTokenCount,
      subChunks: splitChunkIntoSubChunks(currentChunk)
    });
  }

  return chunks;
}

// 번역된 텍스트를 서브청크에 매핑
export function mapTranslationToSubChunks(chunk: Chunk, translatedText: string): SubChunk[] {
  const translatedParts = splitByTimeMarkers(translatedText);
  const subChunkCount = chunk.subChunks.length;
  const partsPerSubChunk = Math.ceil(translatedParts.length / subChunkCount);
  
  return chunk.subChunks.map((subChunk, index) => {
    const start = index * partsPerSubChunk;
    const end = Math.min(start + partsPerSubChunk, translatedParts.length);
    const translatedSubChunk = translatedParts.slice(start, end).join(' ');
    
    return {
      ...subChunk,
      translation: translatedSubChunk
    };
  });
} 