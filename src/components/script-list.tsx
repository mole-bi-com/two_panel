'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Script {
  id: string
  title: string
  created_at: string
}

interface Translation {
  id: string
  script_id: string
  status: 'pending' | 'completed'
}

interface ScriptListProps {
  initialScripts: Script[]
}

export default function ScriptList({ initialScripts }: ScriptListProps) {
  const [scripts, setScripts] = useState(initialScripts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [translations, setTranslations] = useState<{[key: string]: Translation}>({})
  const router = useRouter()
  const supabase = createClientComponentClient()

  // 번역 상태 로드 및 실시간 구독
  useEffect(() => {
    async function loadTranslations() {
      try {
        const { data, error } = await supabase
          .from('translations')
          .select('id, script_id, status')
          .in('script_id', scripts.map(s => s.id))

        if (error) throw error

        const translationMap = data.reduce((acc, translation) => ({
          ...acc,
          [translation.script_id]: translation
        }), {})

        setTranslations(translationMap)
      } catch (error) {
        console.error('Error loading translations:', error)
      }
    }

    // 초기 로드
    if (scripts.length > 0) {
      loadTranslations()
    }

    // 실시간 업데이트 구독
    const channel = supabase
      .channel('translation-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'translations'
        },
        (payload) => {
          const updatedTranslation = payload.new as Translation
          setTranslations(prev => ({
            ...prev,
            [updatedTranslation.script_id]: updatedTranslation
          }))
        }
      )
      .subscribe()

    // 클린업
    return () => {
      supabase.removeChannel(channel)
    }
  }, [scripts])

  // 삭제 처리
  async function handleDelete(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setScripts(scripts.filter(script => script.id !== id))
      router.refresh()
    } catch (error) {
      console.error('Error deleting script:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // 수정 시작
  function handleEdit(script: Script) {
    setEditingId(script.id)
    setEditTitle(script.title)
  }

  // 수정 저장
  async function handleSave(id: string) {
    try {
      const { error } = await supabase
        .from('scripts')
        .update({ title: editTitle })
        .eq('id', id)

      if (error) throw error

      setScripts(scripts.map(script => 
        script.id === id ? { ...script, title: editTitle } : script
      ))
      setEditingId(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating script:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  // 수정 취소
  function handleCancel() {
    setEditingId(null)
    setEditTitle('')
  }

  return (
    <div className="space-y-4">
      {scripts.map(script => (
        <div 
          key={script.id} 
          className="bg-white rounded-lg shadow p-4 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingId === script.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(script.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link 
                    href={`/translations/${script.id}/translate`}
                    className="text-lg font-medium hover:text-blue-600"
                  >
                    {script.title}
                  </Link>
                  {translations[script.id] && (
                    <span className={`text-sm px-2 py-1 rounded ${
                      translations[script.id].status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {translations[script.id].status === 'completed' ? '번역 완료' : '번역 중'}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {new Date(script.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            {editingId !== script.id && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(script)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(script.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {scripts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          스크립트가 없습니다. 새 스크립트를 추가해주세요.
        </div>
      )}
    </div>
  )
} 