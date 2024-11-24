import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { createScript } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ 
    cookies: () => cookieStore 
  })

  try {
    const formData = await request.json()
    const newScript = await createScript(formData)

    if (!newScript) {
      return NextResponse.json(
        { error: 'Failed to create script' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(
      { script_id: newScript.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating script:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 