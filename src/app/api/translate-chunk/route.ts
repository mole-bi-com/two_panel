import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 클라이언트 설정
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    // 컨텍스트 인식 프롬프트
    const prompt = `
Translate the following English text to Korean. 
Context: This is a transcript from an academic discussion or lecture.
Requirements:
- Maintain academic/professional tone
- Preserve any technical terms
- Keep time markers in original format
- Ensure natural Korean sentence flow
- Maintain paragraph structure

Text to translate:
${text}

Translation guidelines:
1. Keep parenthetical timestamps unchanged
2. Preserve speaker indicators if present
3. Maintain technical terminology accuracy
4. Use appropriate Korean honorifics
5. Ensure contextual continuity
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const translation = result.response.text();

    return NextResponse.json({ 
      translatedText: translation.trim()
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
} 