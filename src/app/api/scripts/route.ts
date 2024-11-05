import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { title, original_content, translation_tool } = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('scripts')
      .insert({
        title,
        original_content,
        user_id: user.id,
        creation_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translated_content: null
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      script_id: data.script_id,
      translation_tool
    })
  } catch (error) {
    console.error('Error creating script:', error)
    return NextResponse.json(
      { error: 'Failed to create script' },
      { status: 500 }
    )
  }
} 