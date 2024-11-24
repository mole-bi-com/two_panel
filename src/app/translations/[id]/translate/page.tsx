import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import TranslationViewer from '@/components/translation-viewer'

export default async function TranslatePage({
  params
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })

  const { id } = params

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Auth error:', userError)
    notFound()
  }

  // Fetch script data
  const { data: script, error: scriptError } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single()

  if (scriptError) {
    console.error('Error fetching script:', scriptError)
    notFound()
  }

  // Check if translation exists
  const { data: existingTranslation, error: translationError } = await supabase
    .from('translations')
    .select('*')
    .eq('script_id', id)
    .single()

  if (translationError && translationError.code !== 'PGRST116') {
    console.error('Error fetching translation:', translationError)
    throw new Error('Failed to fetch translation')
  }

  // Create new translation if it doesn't exist
  let translationId = existingTranslation?.id
  
  if (!existingTranslation) {
    const { data: newTranslation, error: insertError } = await supabase
      .from('translations')
      .insert([
        {
          script_id: id,
          user_id: user.id,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating translation:', insertError)
      throw new Error('Failed to create translation')
    }
    
    translationId = newTranslation.id
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{script.title}</h1>
      <TranslationViewer 
        script={script} 
        translationId={translationId!} 
      />
    </div>
  )
} 