import { NextResponse } from 'next/server'
import { openaiTranslator } from '@/lib/openai'
import { deeplTranslator } from '@/lib/deepl'
import { geminiTranslator } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { text, previousContext, tool } = await request.json()
    let translation: string

    if (tool === 'openai') {
      translation = await openaiTranslator.translate(text, previousContext)
    } else if (tool === 'deepl') {
      translation = await deeplTranslator.translate(text, previousContext)
    } else if (tool === 'gemini') {
      translation = await geminiTranslator.translate(text, previousContext)
    } else {
      throw new Error('Invalid translation tool')
    }

    return NextResponse.json({ translation })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
