'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import TranslationPanel from '@/components/scripts/translation-panel'
import { Script } from '@/types/script'

export default function TranslatePage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const initialTool = searchParams.get('tool') as 'openai' | 'deepl' || 'openai'
  const [script, setScript] = useState<Script | null>(null)

  useEffect(() => {
    const fetchScript = async () => {
      const response = await fetch(`/api/scripts/${params.id}`)
      const data = await response.json()
      setScript(data)
    }
    fetchScript()
  }, [params.id])

  if (!script) return <div>로딩중...</div>

  return (
    <main className="container mx-auto px-4 py-8">
      <TranslationPanel 
        script={script} 
        initialTool={initialTool}
      />
    </main>
  )
} 