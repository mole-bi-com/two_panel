// 더 정교한 문장 구분 정규식
const SENTENCE_REGEX = /[^.!?]+[.!?]+(?=\s|$)|[^.!?]+(?=[\n\r]|$)/g

// 타임스탬프 정규식
const TIMESTAMP_REGEX = /\[(\d{2}:)?\d{2}:\d{2}\]/

export interface SentencePair {
  id: string
  english: string
  korean: string
  timestamp?: string
  isHighlighted?: boolean
}

// 타임스탬프 추출 함수
function extractTimestamp(text: string): string | undefined {
  const match = text.match(TIMESTAMP_REGEX)
  return match ? match[0] : undefined
}

// 문장 분리 함수 개선
export function splitIntoSentences(text: string): Array<{
  text: string,
  timestamp?: string
}> {
  const sentences = text.match(SENTENCE_REGEX) || []
  
  return sentences.map(sentence => {
    const timestamp = extractTimestamp(sentence)
    const cleanSentence = sentence
      .replace(TIMESTAMP_REGEX, '')
      .trim()
      .replace(/\s+/g, ' ')
    
    return {
      text: cleanSentence,
      timestamp
    }
  }).filter(({ text }) => text.length > 0)
}

// 문장 매칭 함수 개선
export function createSentencePairs(
  englishText: string,
  koreanText: string
): SentencePair[] {
  const englishSentences = splitIntoSentences(englishText)
  const koreanSentences = splitIntoSentences(koreanText)
  
  return englishSentences.map((english, index) => ({
    id: `pair-${index}`,
    english: english.text,
    korean: koreanSentences[index]?.text || '',
    ...(english.timestamp && { timestamp: english.timestamp }),
    isHighlighted: false
  }))
}

// 문장 유사도 검사 함수 (나중에 매칭 정확도 향상에 사용)
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/))
  const words2 = new Set(text2.toLowerCase().split(/\s+/))
  
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
} 