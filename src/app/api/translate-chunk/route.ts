import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 클라이언트 설정
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 재시도 로직이 포함된 번역 함수
async function translateWithRetry(text: string, maxRetries = 5, initialDelay = 3000) {
  let lastError;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 첫 시도가 아니면 딜레이 적용
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${currentDelay}ms delay`);
        await delay(currentDelay);
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.3,  // 더 일관된 결과를 위해 temperature 낮춤
          maxOutputTokens: 2048,  // 출력 토큰 제한
        },
      });

      const result = await model.generateContent(text);
      
      // 성공적인 응답 후 다음 요청을 위한 기본 딜레이
      await delay(1000);
      
      return result.response.text();

    } catch (error: any) {
      lastError = error;
      console.warn(`Translation attempt ${attempt + 1} failed:`, error.message);
      
      if (error.message?.includes('429')) {
        // 할당량 초과 시 딜레이를 지수적으로 증가
        currentDelay *= 2;
        continue;
      }
      
      // 다른 종류의 에러는 즉시 throw
      throw error;
    }
  }

  // 모든 재시도 실패 시
  throw new Error(`Translation failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    // 프롬프트 최적화
    const prompt = `
Translate the following English text to Korean. 
Context: This is a transcript from an academic discussion or lecture.

Requirements:
1. Maintain academic/professional tone
2. Preserve technical terms accurately
3. Keep time markers in original format (e.g., (12:34))
4. Ensure natural Korean flow
5. Maintain paragraph structure

Text to translate:
${text}

Important Notes:
- Keep all timestamps unchanged
- Preserve any speaker indicators
- Use appropriate Korean honorifics
- Maintain contextual continuity
`;

    const translation = await translateWithRetry(prompt);

    return NextResponse.json({ 
      translatedText: translation.trim()
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    const isRateLimit = error instanceof Error && 
      error.message.includes('429');
    
    return NextResponse.json(
      { 
        error: 'Translation failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        retryAfter: isRateLimit ? 10000 : 5000
      },
      { 
        status: isRateLimit ? 429 : 500,
        headers: {
          'Retry-After': isRateLimit ? '10' : '5',
          'X-Error-Type': isRateLimit ? 'rate_limit' : 'internal_error'
        }
      }
    );
  }
} 