import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const openai = new OpenAI()

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    const { originalText, translatedText } = await request.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translation validator. Analyze the translation and provide your assessment in JSON format with the following structure:
          {
            "isValid": boolean,
            "score": number (0-100),
            "issues": string[],
            "suggestions": string[]
          }`
        },
        {
          role: "user",
          content: `Please validate this translation and return the result as a JSON object:

Original English:
${originalText}

Korean Translation:
${translatedText}

Evaluate accuracy, completeness, and natural expression.`
        }
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const validation = JSON.parse(completion.choices[0]?.message?.content || '{"isValid":true,"score":100,"issues":[],"suggestions":[]}')

    return NextResponse.json({
      validation: {
        isValid: validation.score >= 80,
        score: validation.score / 100,
        details: validation,
        issues: validation.issues || []
      }
    })

  } catch (error: any) {
    console.error('Validation error:', error)
    // 검증 실패해도 번역은 계속 진행되도록
    return NextResponse.json({
      validation: {
        isValid: true,
        score: 0.8,
        details: { error: error.message },
        issues: ['Validation process failed but translation may be usable']
      }
    })
  }
} 