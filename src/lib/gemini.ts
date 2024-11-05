import { TranslationTool } from './translation-tools'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" })

function splitTextIntoChunks(text: string): string[] {
  // 문장 단위로 텍스트 분할
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let sentenceCount = 0;
  const SENTENCES_PER_CHUNK = 10; // 한 청크당 약 10개의 문장

  for (const sentence of sentences) {
    // 새 청크 시작 조건:
    // 1. 현재 청크가 비어있지 않고
    // 2. 문장 수가 SENTENCES_PER_CHUNK에 도달했거나
    // 3. 현재 청크 길이가 3000자를 넘어갈 경우
    if (currentChunk && 
        (sentenceCount >= SENTENCES_PER_CHUNK || 
         currentChunk.length + sentence.length > 3000)) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      sentenceCount = 1;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      sentenceCount++;
    }
  }

  // 마지막 청크 추가
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // 마지막 청크가 너무 작다면 이전 청크와 병합
  if (chunks.length > 1 && chunks[chunks.length - 1].length < 500) {
    const lastChunk = chunks.pop()!;
    const previousChunk = chunks.pop()!;
    chunks.push(previousChunk + ' ' + lastChunk);
  }

  return chunks;
}

// 번역 결과에 영어가 너무 많이 포함되어 있는지 검사하는 함수
function hasExcessiveEnglish(text: string): boolean {
  // 영어 단어 패턴 (숫자와 기호는 제외)
  const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
  const totalWords = text.split(/\s+/).length;
  
  // 영어 단어가 전체 단어의 5% 이상이면 true 반환
  return englishWords.length > totalWords * 0.05;
}

export const geminiTranslator: TranslationTool = {
  name: 'Gemini',
  
  async translate(text: string, previousContext: string = "") {
    try {
      const chunks = splitTextIntoChunks(text);
      console.log(`총 ${chunks.length}개의 청크로 분할됨`);
      
      let translatedText = '';
      let failedChunks: number[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`청크 ${i + 1}/${chunks.length} 번역 시작 (길이: ${chunk.length})`);

        let retryCount = 0;
        let success = false;
        let translatedChunk = '';

        while (retryCount < 3 && !success) {
          try {
            if (retryCount > 0 || i > 0) {
              const delay = Math.pow(2, retryCount + 2) * 1000;
              console.log(`${delay/1000}초 대기 중...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            const prompt = `You are a Korean translator. Translate the following English text to Korean.
            Rules:
            1. Provide ONLY the Korean translation
            2. Do not include the original English text in your response
            3. Translate naturally while preserving the original meaning
            4. Keep the translation formal and professional
            5. Maintain paragraph breaks if present

            Text to translate:
            "${chunk}"

            Translate to Korean:`;

            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }]}],
              generationConfig: {
                temperature: 0.1,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 8192,
              },
            });

            const response = await result.response;
            translatedChunk = response.text().trim();

            // 번역 결과 검증
            if (!translatedChunk || translatedChunk.length < chunk.length * 0.2) {
              throw new Error('Translation result too short');
            }

            // 영어 단어가 너무 많이 포함되어 있는지 검사
            if (hasExcessiveEnglish(translatedChunk)) {
              throw new Error('Translation contains too much English');
            }

            success = true;
            console.log(`청크 ${i + 1} 번역 완료 (${((i + 1) / chunks.length * 100).toFixed(1)}%)`);

          } catch (error) {
            retryCount++;
            console.error(`청크 ${i + 1} 번역 실패 (시도 ${retryCount}/3):`, error);
            
            if (retryCount === 3) {
              failedChunks.push(i);
              translatedChunk = `[번역 실패: 청크 ${i + 1}]\n${chunk}`;
            }
          }
        }

        // 번역된 청크를 전체 결과에 추가
        translatedText += (translatedText ? '\n\n' : '') + translatedChunk;

        // API 속도 제한 고려
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (failedChunks.length > 0) {
        console.error(`실패한 청크들: ${failedChunks.join(', ')}`);
      }

      return translatedText;
    } catch (error) {
      console.error('Gemini translation error:', error);
      throw error;
    }
  },

  async validateTranslation(originalText: string, translatedText: string) {
    return {
      isValid: true,
      score: 1,
      details: { message: 'Gemini translation completed' },
      issues: []
    }
  }
} 