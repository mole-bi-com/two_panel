import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function ScriptPage({
  params
}: {
  params: { id: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: script, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !script) {
    console.error('Error fetching script:', error)
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{script.title}</h1>
      <div className="border rounded p-4">
        <pre className="whitespace-pre-wrap">{script.original_content}</pre>
      </div>
    </div>
  )
} 