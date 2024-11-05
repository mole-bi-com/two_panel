'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NewScriptForm from '@/components/scripts/new-script-form'

export default function NewTranslationPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">새 번역 시작</h1>
      <NewScriptForm />
    </main>
  )
} 