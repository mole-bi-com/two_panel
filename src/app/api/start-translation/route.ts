import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { title, content } = await request.json()
    
    if (!content) {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    // Get the current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Insert the script record with user_id
    const { data: script, error: scriptError } = await supabase
      .from('scripts')
      .insert([
        { 
          title: title || 'Untitled Script',
          original_content: content,
          user_id: user.id
        }
      ])
      .select('id')
      .single()

    if (scriptError) {
      console.error('Database error:', scriptError)
      return NextResponse.json(
        { error: 'Failed to create script', details: scriptError },
        { status: 500 }
      )
    }

    if (!script || !script.id) {
      console.error('No script data returned:', script)
      return NextResponse.json(
        { error: 'Failed to create script - no data returned' },
        { status: 500 }
      )
    }

    return NextResponse.json({ scriptId: script.id })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 