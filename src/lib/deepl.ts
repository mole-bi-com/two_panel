import { TranslationTool } from '@/lib/translation-tools'

const DEEPL_API_KEY = 'c5e07568-a40f-41e5-a0f9-883b7c3b1da0:fx'
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

export const deeplTranslator: TranslationTool = {
  name: 'DeepL',
  
  async translate(text: string, previousContext: string = "") {
    try {
      // 청크 크기를 4000자로 설정 (DeepL 권장 크기)
      const CHUNK_SIZE = 4000;
      const chunks: string[] = [];
      
      // 전체 텍스트를 문단 단위로 분할
      const paragraphs = text.split(/\n\s*\n/);
      let currentChunk = '';
      
      // 문단을 청크로 결합
      for (const paragraph of paragraphs) {
        if ((currentChunk.length + paragraph.length + 2) > CHUNK_SIZE) {
          chunks.push(currentChunk.trim());
          currentChunk = paragraph;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
      }
      
      // 마지막 청크 추가
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      console.log(`총 청크 수: ${chunks.length}`);
      let translatedText = '';
      let translationProgress = 0;

      // 각 청크를 순차적으로 번역
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`청크 ${i + 1}/${chunks.length} 번역 시작 (길이: ${chunk.length})`);
        
        // 3번까지 재시도
        let retryCount = 0;
        let success = false;
        let translatedChunk = '';
        
        while (retryCount < 3 && !success) {
          try {
            const response = await fetch(DEEPL_API_URL, {
              method: 'POST',
              headers: {
                'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: [chunk],
                source_lang: 'EN',
                target_lang: 'KO',
                split_sentences: '0',
                preserve_formatting: true,
                formality: 'default',
                // 이전 청크의 마지막 부분을 컨텍스트로 사용
                context: i > 0 ? chunks[i - 1].slice(-200) : undefined
              })
            });

            if (!response.ok) {
              throw new Error(`DeepL API request failed: ${response.status}`);
            }

            const data = await response.json();
            translatedChunk = data.translations[0].text;
            success = true;
            
            // 진행률 계산 및 로깅
            translationProgress = ((i + 1) / chunks.length) * 100;
            console.log(`청크 ${i + 1} 번역 완료 (${translationProgress.toFixed(1)}%)`);
            
          } catch (error) {
            retryCount++;
            console.error(`청크 ${i + 1} 번역 실패 (시도 ${retryCount}/3):`, error);
            if (retryCount === 3) throw error;
            // 재시도 전 대기
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        // 번역된 청크를 전체 결과에 추가
        if (translatedText && !translatedText.endsWith('\n')) {
          translatedText += chunk.includes('\n\n') ? '\n\n' : ' ';
        }
        translatedText += translatedChunk;

        // API 속도 제한 고려
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return translatedText.trim();
    } catch (error) {
      console.error('DeepL translation error:', error);
      throw error;
    }
  },

  async validateTranslation(originalText: string, translatedText: string) {
    if (!originalText || !translatedText) {
      return {
        isValid: false,
        score: 0,
        details: { message: 'Missing input or translation' },
        issues: ['Empty input or translation']
      }
    }

    // 기본적인 검증
    const lengthDiff = Math.abs(originalText.length - translatedText.length)
    const lengthRatio = lengthDiff / originalText.length

    if (lengthRatio > 0.5) {
      return {
        isValid: false,
        score: 0.5,
        details: { message: 'Significant length difference detected' },
        issues: ['Translation length varies significantly from original']
      }
    }

    return {
      isValid: true,
      score: 1,
      details: { message: 'DeepL translation completed' },
      issues: []
    }
  }
} 