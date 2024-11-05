'use client'

interface DualPanelViewerProps {
  originalText: string
  translatedText: string
  currentChunk?: number
  totalChunks?: number
  chunks?: {
    original: string
    translated: string
  }[]
}

export default function DualPanelViewer({
  originalText,
  translatedText,
  currentChunk = 0,
  totalChunks = 0,
  chunks = []
}: DualPanelViewerProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">원문</h2>
        <div className="space-y-6">
          {chunks.length > 0 ? (
            chunks.map((chunk, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="text-sm text-gray-500 mb-2">청크 {index + 1}</div>
                <p className="whitespace-pre-wrap">{chunk.original}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-wrap">{originalText}</p>
          )}
        </div>
      </div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">번역</h2>
        <div className="space-y-6">
          {chunks.length > 0 ? (
            chunks.map((chunk, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="text-sm text-gray-500 mb-2">청크 {index + 1} 번역</div>
                <p className="whitespace-pre-wrap">{chunk.translated}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-wrap">{translatedText}</p>
          )}
        </div>
      </div>
    </div>
  )
} 