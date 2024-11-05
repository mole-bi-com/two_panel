'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewScriptForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTool, setSelectedTool] = useState<'openai' | 'deepl' | 'gemini'>('gemini')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          original_content: content,
          translation_tool: selectedTool
        }),
      })

      if (!response.ok) throw new Error('Failed to create script')

      const data = await response.json()
      router.push(`/scripts/${data.script_id}/translate?tool=${selectedTool}`)
    } catch (error) {
      console.error('Error:', error)
      alert('스크립트 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          제목
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="tool" className="block text-sm font-medium text-gray-700">
          번역 도구 선택
        </label>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setSelectedTool('openai')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              selectedTool === 'openai'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="font-medium">OpenAI (GPT-4)</div>
            <div className="text-sm text-gray-500 mt-1">
              문맥을 더 잘 이해하고 자연스러운 번역을 제공합니다.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTool('deepl')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              selectedTool === 'deepl'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="font-medium">DeepL</div>
            <div className="text-sm text-gray-500 mt-1">
              빠르고 정확한 전문 번역 서비스입니다.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTool('gemini')}
            className={`p-4 border rounded-lg text-left transition-colors ${
              selectedTool === 'gemini'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
          >
            <div className="font-medium">Gemini Pro</div>
            <div className="text-sm text-gray-500 mt-1">
              구글의 최신 AI 모델로 긴 문맥 처리에 강합니다.
            </div>
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          번역할 텍스트
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? '처리중...' : '번역 시작'}
      </button>
    </form>
  )
} 