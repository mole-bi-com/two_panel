'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Script {
  id: string
  title: string
  created_at: string
}

export default function ScriptList() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadScripts() {
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('id, title, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        setScripts(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scripts')
      } finally {
        setLoading(false)
      }
    }

    loadScripts()
  }, [supabase])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-4">
      {scripts.map((script) => (
        <div
          key={script.id}
          className="border rounded p-4 hover:bg-gray-50"
        >
          <Link href={`/translations/${script.id}/translate`}>
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{script.title}</h3>
              <span className="text-sm text-gray-500">
                {new Date(script.created_at).toLocaleDateString()}
              </span>
            </div>
          </Link>
        </div>
      ))}
      {scripts.length === 0 && (
        <div className="text-gray-500 text-center">
          No scripts found. Create a new one to get started.
        </div>
      )}
    </div>
  )
} 