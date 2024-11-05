import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    })

    const { scriptId, originalContent, translatedContent, metrics } = await request.json()

    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      // 기존 번역 확인
      const { data: existingSection } = await supabase
        .from('sections')
        .select('section_id')
        .eq('script_id', scriptId)
        .eq('section_number', 1)
        .single()

      const timestamp = new Date().toISOString()

      if (existingSection) {
        // 기존 번역 업데이트
        const { error: updateError } = await supabase
          .from('sections')
          .update({
            english_content: originalContent,
            korean_content: translatedContent,
            translation_status: 'completed',
            metrics,
            updated_at: timestamp
          })
          .eq('section_id', existingSection.section_id)

        if (updateError) throw updateError
      } else {
        // 새 번역 삽입
        const { error: insertError } = await supabase
          .from('sections')
          .insert({
            script_id: scriptId,
            section_number: 1,
            english_content: originalContent,
            korean_content: translatedContent,
            translation_status: 'completed',
            metrics,
            created_at: timestamp,
            updated_at: timestamp
          })

        if (insertError) throw insertError
      }

      // 스크립트 업데이트 시간도 갱신
      await supabase
        .from('scripts')
        .update({ updated_at: timestamp })
        .eq('script_id', scriptId)

      return NextResponse.json({ 
        success: true,
        message: 'Translation saved successfully'
      })

    } catch (dbError: any) {
      console.error('Database operation error:', dbError)
      return NextResponse.json(
        { 
          error: 'Database operation failed',
          details: dbError.message
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Save translation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save translation',
        details: error.message
      },
      { status: 500 }
    )
  }
} 