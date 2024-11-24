import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import ScriptList from '@/components/script-list'

export default async function ScriptsPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 사용자의 스크립트만 가져오기
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">스크립트 목록</h1>
        <Link 
          href="/scripts/new" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          새 스크립트
        </Link>
      </div>
      <ScriptList initialScripts={scripts || []} />
    </div>
  )
} 