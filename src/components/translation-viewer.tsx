'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TranslationProgress from './translation-progress'
import { splitIntoChunks } from '@/utils/text-chunker'

interface TranslationViewerProps {
  script: {
    id: string
    original_content: string
  }
  translationId: string
}

export default function TranslationViewer({ script, translationId }: TranslationViewerProps) {
  const [status, setStatus] = useState<'idle' | 'translating' | 'completed' | 'error'>('idle')
  const [currentChunk, setCurrentChunk] = useState(0)
  const [translations, setTranslations] = useState<{[key: number]: string}>({})
  const [error, setError] = useState<string | null>(null)
  const [selectedChunk, setSelectedChunk] = useState(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const supabase = createClientComponentClient()
  const chunks = splitIntoChunks(script.original_content)
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0)
  const currentTokens = chunks
    .slice(0, currentChunk + 1)
    .reduce((sum, chunk) => sum + chunk.tokens, 0)

  // 저장된 번역 불러오기
  useEffect(() => {
    async function loadTranslations() {
      try {
        // 번역 상태 확인
        const { data: translationData, error: translationError } = await supabase
          .from('translations')
          .select('status')
          .eq('id', translationId)
          .single()

        if (translationError && translationError.code !== 'PGRST116') {
          throw translationError
        }

        // 번역 청크 데이터 로드
        const { data: chunks, error: chunksError } = await supabase
          .from('translation_chunks')
          .select('chunk_id, translated_content')
          .eq('translation_id', translationId)
          .order('chunk_id')

        if (chunksError) throw chunksError

        if (chunks?.length > 0) {
          const loadedTranslations = chunks.reduce((acc, item) => ({
            ...acc,
            [item.chunk_id]: item.translated_content
          }), {})

          setTranslations(loadedTranslations)
          
          // 모든 청크가 번역되었는지 확인
          if (Object.keys(loadedTranslations).length >= chunks.length) {
            setStatus('completed')
          }
        }
      } catch (err) {
        console.error('Error loading translations:', err)
        setError('번역 데이터 로드 중 오류 발생')
      }
    }

    loadTranslations()
  }, [translationId])

  // 번역 결과 저장
  async function saveTranslation(chunkId: number, text: string) {
    try {
      setIsSaving(true)
      console.log('Starting translation save:', { translationId, chunkId, text })

      // 1. 사용자 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('User authentication error:', userError)
        throw new Error('인증 오류가 발생했습니다')
      }

      if (!user) {
        throw new Error('로그인이 필요합니다')
      }

      // 2. translation 레코드 확인/생성
      const { data: existingTranslation, error: checkError } = await supabase
        .from('translations')
        .select('*')
        .eq('id', translationId)
        .single()

      console.log('Existing translation check:', { existingTranslation, checkError })

      if (checkError && checkError.code === 'PGRST116') {
        // translation 레코드가 없는 경우 생성
        const { data: newTranslation, error: createError } = await supabase
          .from('translations')
          .insert({
            id: translationId,
            script_id: script.id,
            user_id: user.id,
            status: 'pending'
          })
          .select()
          .single()

        if (createError) {
          console.error('Translation record creation error:', createError)
          throw new Error('번역 기록 생성 중 오류가 발생했습니다')
        }

        console.log('Created new translation record:', newTranslation)
      } else if (checkError) {
        console.error('Translation check error:', checkError)
        throw new Error('번역 기록 확인 중 오류가 발생했습니다')
      }

      // 3. 번역 청크 저장
      const { data: savedChunk, error: chunkError } = await supabase
        .from('translation_chunks')
        .upsert({
          translation_id: translationId,
          chunk_id: chunkId,
          translated_content: text,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'translation_id,chunk_id'
        })
        .select()
        .single()

      if (chunkError) {
        console.error('Chunk save error:', chunkError)
        throw new Error('번역 내용 저장 중 오류가 발생했습니다')
      }

      console.log('Saved chunk:', savedChunk)

      // 4. 모든 청크가 번역되었는지 확인
      const { data: allChunks, error: countError } = await supabase
        .from('translation_chunks')
        .select('chunk_id')
        .eq('translation_id', translationId)

      if (countError) {
        console.error('Chunk count error:', countError)
        throw new Error('번역 상태 확인 중 오류가 발생했습니다')
      }

      const isAllTranslated = allChunks.length === chunks.length

      if (isAllTranslated) {
        const { error: statusError } = await supabase
          .from('translations')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', translationId)

        if (statusError) {
          console.error('Status update error:', statusError)
          throw new Error('번역 완료 상태 업데이트 중 오류가 발생했습니다')
        }

        setStatus('completed')
        console.log('Translation completed and status updated')
      }

      // UI 업데이트
      setTranslations(prev => ({
        ...prev,
        [chunkId]: text
      }))

    } catch (err) {
      console.error('Detailed save error:', err)
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(`청크 ${chunkId + 1} 저장 중 오류: ${errorMessage}`)
      throw err // 상위 에러 핸들러에서 처리할 수 있도록 다시 throw
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    async function translateChunks() {
      if (isTranslating) return
      
      setIsTranslating(true)
      setStatus('translating')
      setError(null)
      
      try {
        for (const chunk of chunks) {
          if (translations[chunk.id]) continue;
          
          setCurrentChunk(chunk.id)
          const response = await fetch('/api/translate-chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chunk.text,
              targetLanguage: 'Korean'
            })
          })

          if (!response.ok) {
            throw new Error(`Translation failed for chunk ${chunk.id + 1}`)
          }

          const data = await response.json()
          const translatedText = data.translatedText
          
          // 번역 결과 저장
          await saveTranslation(chunk.id, translatedText)
          
          setTranslations(prev => ({
            ...prev,
            [chunk.id]: translatedText
          }))
        }
        
        setStatus('completed')
      } catch (err) {
        console.error('Translation error:', err)
        setError(`청크 ${currentChunk + 1} 번역 중 오류 발생`)
        setStatus('error')
      } finally {
        setIsTranslating(false)
      }
    }

    translateChunks()
  }, [script.id])

  // 선택된 청크로 스크롤
  useEffect(() => {
    const element = document.getElementById(`chunk-${selectedChunk}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedChunk])

  // 청크 네비게이션
  const goToPreviousChunk = () => {
    if (selectedChunk > 0) {
      setSelectedChunk(selectedChunk - 1)
    }
  }

  const goToNextChunk = () => {
    if (selectedChunk < chunks.length - 1) {
      setSelectedChunk(selectedChunk + 1)
    }
  }

  // 번역 완료 알림
  useEffect(() => {
    if (status === 'completed') {
      const notification = new Notification('번역 완료', {
        body: '모든 청크의 번역이 완료되었습니다.'
      })
    }
  }, [status])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <TranslationProgress 
            totalTokens={totalTokens}
            currentTokens={currentTokens}
            status={status}
          />
        </div>
      </div>

      {/* Selected chunk viewer with navigation */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goToPreviousChunk}
            disabled={selectedChunk === 0}
            className={`p-2 rounded-full ${
              selectedChunk === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              청크 {selectedChunk + 1} / {chunks.length}
              {chunks[selectedChunk]?.timeMarker && (
                <span className="ml-2 text-sm text-gray-500">
                  {chunks[selectedChunk].timeMarker}
                </span>
              )}
            </h3>
            <span className="text-sm text-gray-500">
              {chunks[selectedChunk]?.tokens.toLocaleString()} tokens
            </span>
          </div>
          <button
            onClick={goToNextChunk}
            disabled={selectedChunk === chunks.length - 1}
            className={`p-2 rounded-full ${
              selectedChunk === chunks.length - 1 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="prose max-w-none">
              {chunks[selectedChunk]?.text}
            </div>
          </div>
          <div>
            <div className="prose max-w-none">
              {translations[selectedChunk] ? (
                <div className="text-gray-800 whitespace-pre-wrap">
                  {translations[selectedChunk]}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {status === 'translating' && currentChunk === selectedChunk ? (
                    <div className="flex items-center text-blue-500">
                      <span className="mr-3">번역 중</span>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    '대기 중...'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 저장 상태 표시 */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {isSaving && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            번역 저장 중...
          </div>
        )}
        {!isSaving && status === 'completed' && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            모든 번역이 저장되었습니다
          </div>
        )}
      </div>
    </div>
  )
} 