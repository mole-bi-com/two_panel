'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Script } from '@/types/script'
import DualPanelViewer from './dual-panel-viewer'
import ProgressCircle from '../ui/progress-circle'

interface TranslationPanelProps {
  script: Script
  initialTool: 'openai' | 'deepl' | 'gemini'
}

export default function TranslationPanel({
  script,
  initialTool
}: TranslationPanelProps) {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState(initialTool)
  const [translatedText, setTranslatedText] = useState('')
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [translationComplete, setTranslationComplete] = useState(false)

  useEffect(() => {
    const startTranslation = async () => {
      if (!script.content) return;

      try {
        setProgress(10)
        setStatusMessage('번역 준비중...')

        // 번역 요청
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: script.content,
            tool: selectedTool
          }),
        })

        if (!response.ok) throw new Error('Translation failed')

        const data = await response.json()
        const fullTranslation = data.translation

        // 번역 결과가 비어있는지 확인
        if (!fullTranslation) {
          throw new Error('Empty translation result')
        }

        setTranslatedText(fullTranslation)
        setProgress(70)
        setStatusMessage('번역 완료, 결과 저장중...')

        // 번역 결과 저장
        const saveResponse = await fetch(`/api/scripts/${script.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ translated_content: fullTranslation }),
        })

        if (!saveResponse.ok) {
          throw new Error('Failed to save translation')
        }

        // 저장 성공 확인
        const verifyResponse = await fetch(`/api/scripts/${script.id}`)
        const verifyData = await verifyResponse.json()

        if (!verifyData.translatedContent) {
          throw new Error('Failed to verify saved translation')
        }

        setProgress(100)
        setStatusMessage('번역 완료!')
        setTranslationComplete(true)

        // 결과 확인을 위해 5초 대기 후 이동
        await new Promise(resolve => setTimeout(resolve, 5000))
        router.push(`/scripts/${script.id}`)

      } catch (error) {
        console.error('Translation error:', error)
        setProgress(0)
        setStatusMessage('번역 실패')
        alert('번역 또는 저장 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }

    startTranslation()
  }, [script.id, script.content, selectedTool, router])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{script.title}</h1>
        <div className="flex items-center gap-4">
          <ProgressCircle progress={progress} />
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900">
              {statusMessage}
            </div>
            {translationComplete && (
              <div className="text-xs text-green-500">
                5초 후 결과 페이지로 이동합니다...
              </div>
            )}
          </div>
        </div>
      </div>
      <DualPanelViewer 
        originalText={script.content}
        translatedText={translatedText}
      />
    </div>
  )
} 