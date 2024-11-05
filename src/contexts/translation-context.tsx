'use client'

import { createContext, useContext, useState } from 'react'

type TranslationStatus = 'idle' | 'translating' | 'completed' | 'error'

type TranslationContextType = {
  status: TranslationStatus
  progress: number
  startTranslation: () => void
  setProgress: (progress: number) => void
  setStatus: (status: TranslationStatus) => void
}

const TranslationContext = createContext<TranslationContextType>({
  status: 'idle',
  progress: 0,
  startTranslation: () => {},
  setProgress: () => {},
  setStatus: () => {}
})

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TranslationStatus>('idle')
  const [progress, setProgress] = useState(0)

  const startTranslation = () => {
    setStatus('translating')
    setProgress(0)
  }

  return (
    <TranslationContext.Provider 
      value={{ 
        status, 
        progress, 
        startTranslation, 
        setProgress, 
        setStatus 
      }}
    >
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => useContext(TranslationContext) 