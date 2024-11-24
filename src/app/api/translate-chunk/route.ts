import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 클라이언트 설정
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    // Gemini 모델 초기화 (1.5 Flash 사용)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 번역 프롬프트 생성
    const prompt = `Translate the following text to ${targetLanguage}. 
    Only provide the translation without any additional explanation:
    "${text}"`;

    // 번역 수행
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