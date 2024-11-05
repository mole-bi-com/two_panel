import { TranslationTool } from './translation-tools'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// 토큰 수 추정 함수 (영어 기준 단어 수 * 1.3)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3)
}

export const openaiTranslator: TranslationTool = {
  name: 'OpenAI',
  
  async translate(text: string, previousContext: string = "") {
    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured')
      }

      // GPT-4의 토큰 제한을 고려한 청크 크기 설정
      const MAX_INPUT_TOKENS = 2000; // 입력 토큰 제한 (안전하게 설정)
      const chunks: string[] = [];
      
      // 문단 단위로 분할
      const paragraphs = text.split(/\n\s*\n/);
      let currentChunk = '';
      let currentTokens = 0;
      
      for (const paragraph of paragraphs) {
        const paragraphTokens = estimateTokenCount(paragraph);
        
        if (paragraphTokens > MAX_INPUT_TOKENS) {
          // 큰 문단은 문장 단위로 분할
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            const sentenceTokens = estimateTokenCount(sentence);
            if (currentTokens + sentenceTokens > MAX_INPUT_TOKENS) {
              if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                currentTokens = sentenceTokens;
              } else {
                chunks.push(sentence.trim());
              }
            } else {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
              currentTokens += sentenceTokens;
            }
          }
        } else if (currentTokens + paragraphTokens > MAX_INPUT_TOKENS) {
          chunks.push(currentChunk.trim());
          currentChunk = paragraph;
          currentTokens = paragraphTokens;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
          currentTokens += paragraphTokens;
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      console.log(`총 ${chunks.length}개의 청크로 분할됨`);
      let translatedText = '';
      
      // 각 청크를 순차적으로 번역
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const estimatedTokens = estimateTokenCount(chunk);
        console.log(`청크 ${i + 1}/${chunks.length} 번역 중 (예상 토큰 수: ${estimatedTokens})`);

        // 재시도 로직
        let retryCount = 0;
        let success = false;
        let translatedChunk = '';

        while (retryCount < 3 && !success) {
          try {
            // Rate limit 방지를 위한 지수 백오프
            if (retryCount > 0 || i > 0) {
              const baseDelay = 20000; // 기본 20초 대기
              const delay = retryCount > 0 ? baseDelay * Math.pow(2, retryCount) : baseDelay;
              console.log(`${delay/1000}초 대기 중...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }

            const response = await fetch(OPENAI_API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: "You are a professional translator specializing in English to Korean translation. Maintain the original formatting and structure. Translate naturally while preserving the meaning."
                  },
                  {
                    role: "user",
                    content: `Translate the following English text to Korean:\n\n${chunk}`
                  }
                ],
                temperature: 0.3,
                max_tokens: Math.min(4000, estimatedTokens * 2), // 출력 토큰 제한
                presence_penalty: 0,
                frequency_penalty: 0
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              if (response.status === 429) {
                // Rate limit 에러 시 더 오래 대기
                const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10);
                console.log(`Rate limit 도달. ${retryAfter}초 대기...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                throw new Error('Rate limit reached, retrying...');
              }
              throw new Error(`OpenAI API request failed: ${response.status} ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            translatedChunk = data.choices[0].message.content.trim();
            success = true;

          } catch (error) {
            retryCount++;
            console.error(`청크 ${i + 1} 번역 실패 (시도 ${retryCount}/3):`, error);
            if (retryCount === 3) throw error;
          }
        }

        // 번역된 청크를 전체 결과에 추가
        if (translatedText && !translatedText.endsWith('\n')) {
          translatedText += chunks[i-1]?.includes('\n\n') ? '\n\n' : ' ';
        }
        translatedText += translatedChunk;
      }

      return translatedText.trim();
      
    } catch (error: any) {
      console.error('OpenAI translation error:', error);
      throw new Error(`OpenAI translation failed: ${error.message}`);
    }
  },

  async validateTranslation(originalText: string, translatedText: string) {
    return {
      isValid: true,
      score: 1,
      details: { message: 'OpenAI translation completed' },
      issues: []
    }
  }
}