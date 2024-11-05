import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Script } from '@/types/script'

export default async function ScriptPage({ 
  params 
}: { 
  params: { id: string } 
}) {
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
    .eq('script_id', params.id)
    .single()

  if (error || !script) {
    console.error('Error fetching script:', error)
    notFound()
  }

  const scriptData: Script = {
    id: script.script_id,
    title: script.title,
    content: script.original_content,
    translatedContent: script.translated_content,
    createdAt: script.creation_date,
    updatedAt: script.updated_at,
    userId: script.user_id
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{scriptData.title}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">원문</h2>
          <p className="whitespace-pre-wrap">{scriptData.content}</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">번역</h2>
          <p className="whitespace-pre-wrap">{scriptData.translatedContent}</p>
        </div>
      </div>
    </main>
  )
} 