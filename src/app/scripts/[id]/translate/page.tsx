'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import TranslationPanel from '@/components/scripts/translation-panel'
import { Script } from '@/types/script'
import ProgressCircle from '@/components/ui/progress-circle'

export default function TranslatePage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const initialTool = searchParams.get('tool') as 'openai' | 'deepl' || 'openai'
  const [script, setScript] = useState<Script | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchScript = async () => {
      try {
        const response = await fetch(`/api/scripts/${params.id}`)
        const data = await response.json()
        setScript(data)
      } catch (error) {
        console.error('Error fetching script:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchScript()
  }, [params.id])

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <ProgressCircle progress={30} />
          <p className="mt-4 text-gray-600">스크립트 불러오는 중...</p>
        </div>
      </main>
    )
  }

  if (!script) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          스크립트를 찾을 수 없습니다.
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <TranslationPanel 
        script={script} 
        initialTool={initialTool}
      />
    </main>
  )
} 