'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Script } from '@/types/script'
import { Trash2 } from 'lucide-react'

interface ScriptListProps {
  scripts: Script[]
}

export default function ScriptList({ scripts }: ScriptListProps) {
  const [localScripts, setLocalScripts] = useState(scripts)

  const handleDelete = async (scriptId: string) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete script')
      }

      setLocalScripts(prevScripts => 
        prevScripts.filter(script => script.id !== scriptId)
      )
    } catch (error) {
      console.error('Error deleting script:', error)
      alert('스크립트 삭제에 실패했습니다.')
    }
  }

  return (
    <ul className="divide-y divide-gray-200">
      {localScripts.map((script) => (
        <li key={script.id} className="py-4 flex justify-between items-center">
          <Link 
            href={`/scripts/${script.id}`}
            className="flex-1 hover:text-blue-600"
          >
            <h3 className="text-lg font-medium">{script.title}</h3>
            <p className="text-sm text-gray-500">
              완료일: {new Date(script.updatedAt).toLocaleDateString()}
            </p>
          </Link>
          <button
            onClick={() => handleDelete(script.id)}
            className="ml-4 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
            aria-label="스크립트 삭제"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </li>
      ))}
    </ul>
  )
} 