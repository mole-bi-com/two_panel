import { createServerClient } from '@/lib/supabase/server'
import ScriptList from '@/components/scripts/script-list'
import { Script } from '@/types/script'
import Link from 'next/link'
import { Database } from '@/types/supabase'

export default async function ScriptsPage() {
  const supabase = await createServerClient()
  
  const { data: scriptsData, error } = await supabase
    .from('scripts')
    .select('*')
    .returns<Database['public']['Tables']['scripts']['Row'][]>()

  if (error) {
    console.error('Error fetching scripts:', error)
    return <div>스크립트를 불러오는데 실패했습니다.</div>
  }

  const scripts: Script[] = scriptsData.map(script => ({
    id: script.script_id,
    title: script.title,
    content: script.original_content,
    createdAt: script.creation_date,
    updatedAt: script.updated_at,
    userId: script.user_id
  }))

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">스크립트 목록</h1>
        <Link
          href="/scripts/new"
          className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          새 스크립트
        </Link>
      </div>
      {scripts && scripts.length > 0 ? (
        <ScriptList scripts={scripts} />
      ) : (
        <p className="text-gray-500">저장된 스크립트가 없습니다.</p>
      )}
    </main>
  )
} 