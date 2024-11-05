import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: { scriptId: string } }
) {
  try {
    const supabase = await createServerClient()
    
    const { data: script, error } = await supabase
      .from('scripts')
      .select(`
        script_id,
        user_id,
        title,
        original_content,
        translated_content,
        creation_date,
        updated_at
      `)
      .eq('script_id', params.scriptId)
      .single()

    if (error) {
      throw error
    }

    // 프론트엔드 형식으로 변환
    const formattedScript = {
      id: script.script_id,
      title: script.title,
      content: script.original_content,
      translatedContent: script.translated_content,
      createdAt: script.creation_date,
      updatedAt: script.updated_at,
      userId: script.user_id
    }

    return NextResponse.json(formattedScript)
  } catch (error) {
    console.error('Error fetching script:', error)
    return NextResponse.json(
      { error: 'Failed to fetch script' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { scriptId: string } }
) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('script_id', params.scriptId)

    if (error) {
      console.error('Error deleting script:', error)
      throw error
    }

    return NextResponse.json({ message: 'Script deleted successfully' })
  } catch (error) {
    console.error('Error deleting script:', error)
    return NextResponse.json(
      { error: 'Failed to delete script' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { scriptId: string } }
) {
  try {
    const supabase = await createServerClient()
    const { translated_content } = await request.json()

    const { error } = await supabase
      .from('scripts')
      .update({ translated_content })
      .eq('script_id', params.scriptId)

    if (error) {
      throw error
    }

    return NextResponse.json({ message: 'Translation updated successfully' })
  } catch (error) {
    console.error('Error updating translation:', error)
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    )
  }
} 