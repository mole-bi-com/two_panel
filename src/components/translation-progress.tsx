'use client'

import { useState, useEffect } from 'react'

interface TranslationProgressProps {
  totalTokens: number
  currentTokens: number
  status: 'idle' | 'translating' | 'completed' | 'error'
}

export default function TranslationProgress({ 
  totalTokens,
  currentTokens,
  status
}: TranslationProgressProps) {
  return (
    <div className="w-full flex justify-between items-center text-sm">
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">
          토큰 처리: <span className="font-medium text-gray-900">
            {currentTokens.toLocaleString()} / {totalTokens.toLocaleString()}
          </span>
        </span>
      </div>
      <div>
        {status === 'translating' && (
          <div className="flex items-center text-blue-500">
            <span className="mr-2">번역 중</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        {status === 'completed' && <span className="text-green-500">번역 완료</span>}
        {status === 'error' && <span className="text-red-500">오류 발생</span>}
      </div>
    </div>
  )
} 