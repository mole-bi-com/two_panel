import { encode } from 'gpt-tokenizer'

interface SubChunk {
  id: number;
  text: string;
  timeMarker?: string;
  translation?: string;
  tokens: number;
}

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  subChunks: SubChunk[];
  isTranslated?: boolean;
}

function calculateTokens(text: string): number {
  return encode(text).length;
}

// 청크를 정확히 400토큰 단위의 서브청크로 나누는 함수
function splitIntoSubChunks(text: string, targetTokens: number = 400): SubChunk[] {
  const subChunks: SubChunk[] = [];
  const timeMarkerRegex = /\((\d{2}:\d{2})\)/g;
  
  let remainingText = text;
  let subChunkId = 0;
  let currentTokens = 0;
  let currentText = '';

  // 단어 단위로 처리하여 토큰 수 계산
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWithSpace = word + ' ';
    const wordTokens = calculateTokens(wordWithSpace);

    // 현재 토큰 수가 목표치를 초과하는 경우
    if (currentTokens + wordTokens > targetTokens && currentText) {
      // 문장이 완성되지 않은 경우 다음 문장 끝까지 포함
      const remainingWords = words.slice(i).join(' ');
      const nextSentenceEnd = remainingWords.match(/[.!?]\s+/);
      
      if (nextSentenceEnd) {
        const additionalText = words
          .slice(i, i + remainingWords.indexOf(nextSentenceEnd[0]) + 1)
          .join(' ');
        currentText += ' ' + additionalText;
        i += additionalText.split(/\s+/).length - 1;
      }

      // 서브청크 추가
      const timeMarker = currentText.match(timeMarkerRegex)?.[0];
      const finalTokens = calculateTokens(currentText);

      subChunks.push({
        id: subChunkId++,
        text: currentText.trim(),
        timeMarker,
        tokens: finalTokens
      });

      // 초기화
      currentText = '';
      currentTokens = 0;
      continue;
    }

    currentText += (currentText ? ' ' : '') + word;
    currentTokens += wordTokens;

    // 마지막 단어 처리
    if (i === words.length - 1 && currentText) {
      const timeMarker = currentText.match(timeMarkerRegex)?.[0];
      const finalTokens = calculateTokens(currentText);

      subChunks.push({
        id: subChunkId++,
        text: currentText.trim(),
        timeMarker,
        tokens: finalTokens
      });
    }
  }

  // 디버깅을 위한 토큰 수 로깅
  subChunks.forEach(chunk => {
    console.log(`SubChunk ${chunk.id} tokens:`, chunk.tokens);
  });

  return subChunks;
}

export function splitIntoChunks(text: string, maxTokens: number = 8000): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk = '';
  let currentTokenCount = 0;
  let chunkId = 0;

  const lines = text.split('\n');

  for (const line of lines) {
    const lineTokens = encode(line).length;
    
    if (currentTokenCount + lineTokens > maxTokens) {
      if (currentChunk) {
        chunks.push({
          id: chunkId++,
          text: currentChunk.trim(),
          tokens: currentTokenCount,
          subChunks: splitIntoSubChunks(currentChunk),
          isTranslated: false
        });
        currentChunk = '';
        currentTokenCount = 0;
      }
    }
    
    currentChunk += line + '\n';
    currentTokenCount += lineTokens;
  }

  if (currentChunk) {
    chunks.push({
      id: chunkId,
      text: currentChunk.trim(),
      tokens: currentTokenCount,
      subChunks: splitIntoSubChunks(currentChunk),
      isTranslated: false
    });
  }

  return chunks;
}

// 번역된 텍스트를 원본 서브청크에 맞게 매핑
export function mapTranslationToSubChunks(chunk: Chunk, translatedText: string): SubChunk[] {
  const subChunkCount = chunk.subChunks.length;
  const totalLength = translatedText.length;
  const baseLength = Math.ceil(totalLength / subChunkCount);

  return chunk.subChunks.map((subChunk, index) => {
    const start = index * baseLength;
    const end = index === subChunkCount - 1 
      ? totalLength 
      : Math.min(start + baseLength, totalLength);

    return {
      ...subChunk,
      translation: translatedText.slice(start, end).trim()
    };
  });
} 