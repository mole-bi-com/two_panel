'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TranslationProgress from './translation-progress'
import { splitIntoChunks, createParagraphMappings } from '@/utils/text-chunker'

interface TranslationViewerProps {
  script: {
    id: string
    original_content: string
  }
  translationId: string
}

interface SentenceMapping {
  id: number;
  english: string;
  korean: string;
  timeMarker?: string;
}

interface HighlightedTextProps {
  mappings: SentenceMapping[];
  isEnglish: boolean;
  onSentenceClick: (id: number) => void;
  selectedId: number | null;
}

interface SentenceProps {
  sentence: {
    id: number;
    text: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

interface CopyButtonProps {
  text: string;
  label: string;
}

interface SubChunk {
  id: number;
  text: string;
  timeMarker?: string;
  translation?: string;
}

interface MappedParagraph {
  id: number;
  text: string;
  timeMarker?: string;
  isHighlighted: boolean;
  charCount: number;
}

const Sentence = ({ sentence, isSelected, onClick }: SentenceProps) => (
  <div
    onClick={onClick}
    className={`
      py-2 px-3 my-1 rounded cursor-pointer
      ${isSelected ? 'bg-yellow-100' : 'hover:bg-gray-50'}
      transition-colors duration-200
    `}
  >
    {sentence.text}
  </div>
);

// 문단 분리 및 매핑 로직
function splitIntoParagraphs(text: string, isSource: boolean): MappedParagraph[] {
  // 시간 마커 정규식
  const timeMarkerRegex = /\((\d{2}:\d{2})\)/g;
  
  // 빈단 구분을 위한 정규식 패턴
  const paragraphSplitPattern = /(?:\r?\n){2,}|\r{2,}|\n{2,}/;
  
  // 문단 분리 (빈 줄로 구분)
  const paragraphs = text
    .split(paragraphSplitPattern)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  console.log('Split paragraphs:', paragraphs); // 디버깅용
  
  return paragraphs.map((text, id) => {
    // 시간 마커 찾기
    const timeMarkers = Array.from(text.matchAll(timeMarkerRegex));
    const timeMarker = timeMarkers.length > 0 ? timeMarkers[0][0] : undefined;

    return {
      id,
      text: text.trim(),
      timeMarker,
      isHighlighted: false
    };
  });
}

const CopyButton = ({ text, label }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 후 상태 리셋
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center px-3 py-1 rounded-md text-sm
        transition-colors duration-200
        ${copied 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          복사됨
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          {label} 복사
        </>
      )}
    </button>
  );
};

const ParagraphBlock = ({ 
  paragraph, 
  onClick,
  isHighlighted,
  isSource
}: { 
  paragraph: MappedParagraph;
  onClick: () => void;
  isHighlighted: boolean;
  isSource: boolean;
}) => (
  <div
    id={`${isSource ? 'source' : 'target'}-${paragraph.id}`}
    onClick={onClick}
    className={`
      p-4 my-3 rounded-lg cursor-pointer transition-all duration-200
      ${isHighlighted ? 'bg-yellow-100' : 'hover:bg-gray-50'}
      border border-transparent hover:border-gray-200
    `}
  >
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500">
        <span>문단 {paragraph.id + 1}</span>
      </div>
      <div className="text-gray-800 whitespace-pre-wrap">
        {paragraph.text}
      </div>
    </div>
  </div>
);

// 텍스트 처리 함수 추가
function processText(text: string): string {
  // 줄바꿈 문자를 유지하면서 텍스트 처리
  return text
    .split('\n')
    .map(line => line.trim())
    .join('\n');
}

// 500자 단위로 텍스트 분할하는 함수
function splitIntoFixedCharacters(text: string, charLimit: number = 500): MappedParagraph[] {
  // 시간 마커 정규식
  const timeMarkerRegex = /\((\d{2}:\d{2})\)/g;
  
  // 전체 텍스트에서 시간 마커 찾기
  const allTimeMarkers = Array.from(text.matchAll(timeMarkerRegex));
  let currentTimeMarker = '';
  
  // 텍스트를 문자 단위로 분할
  let remainingText = text;
  const paragraphs: MappedParagraph[] = [];
  let paragraphId = 0;

  while (remainingText.length > 0) {
    // 현재 위치에 해당하는 시간 마커 찾기
    const textPosition = text.length - remainingText.length;
    const relevantMarker = allTimeMarkers.find(match => 
      match.index! >= textPosition && match.index! < textPosition + charLimit
    );
    
    if (relevantMarker) {
      currentTimeMarker = relevantMarker[0];
    }

    // 문단 끝 위치 찾기 (가능한 한 문장이 끊기지 않도록)
    let endPosition = Math.min(charLimit, remainingText.length);
    if (endPosition < remainingText.length) {
      // 문장 끝을 찾아 거기서 자르기
      const nextSentenceEnd = remainingText
        .slice(0, endPosition + 100) // 여유 있게 더 보기
        .search(/[.!?]\s+/);
      
      if (nextSentenceEnd > 0) {
        endPosition = nextSentenceEnd + 1;
      }
    }

    // 현재 문단 추출
    const paragraphText = remainingText.slice(0, endPosition).trim();
    
    if (paragraphText.length > 0) {
      paragraphs.push({
        id: paragraphId++,
        text: paragraphText,
        timeMarker: currentTimeMarker,
        isHighlighted: false,
        charCount: paragraphText.length
      });
    }

    // 남은 텍스트 업데이트
    remainingText = remainingText.slice(endPosition).trim();
  }

  return paragraphs;
}

export default function TranslationViewer({ script, translationId }: TranslationViewerProps) {
  const [status, setStatus] = useState<'idle' | 'translating' | 'completed' | 'error'>('idle')
  const [currentChunk, setCurrentChunk] = useState(0)
  const [translations, setTranslations] = useState<{[key: number]: string}>({})
  const [error, setError] = useState<string | null>(null)
  const [selectedChunk, setSelectedChunk] = useState(0)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedSentenceId, setSelectedSentenceId] = useState<number | null>(null);
  const [mappedParagraphs, setMappedParagraphs] = useState<{
    source: MappedParagraph[];
    target: MappedParagraph[];
  }>({ source: [], target: [] });
  
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
          setStatus('completed')
        }
      } catch (err) {
        console.error('Error loading translations:', err)
        setError('번역 데이터 로드 중 오류 발생')
      }
    }

    loadTranslations()
  }, [translationId])

  // 번역 저장 함수
  async function saveTranslationToDb(chunkId: number, text: string) {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('translation_chunks')
        .upsert({
          translation_id: translationId,
          chunk_id: chunkId,
          translated_content: text,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'translation_id,chunk_id'
        });

      if (error) throw error;

      // 모든 청크가 번역되었는지 확인
      const isAllTranslated = chunks.every(chunk => translations[chunk.id]);
      
      if (isAllTranslated) {
        const { error: statusError } = await supabase
          .from('translations')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', translationId);

        if (statusError) throw statusError;
        setStatus('completed');
      }
    } catch (error) {
      console.error('Error saving translation:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  // 번역 로직 수정
  useEffect(() => {
    async function translateChunks() {
      if (isTranslating) return;
      
      setIsTranslating(true);
      setStatus('translating');
      setError(null);
      
      try {
        for (const chunk of chunks) {
          if (translations[chunk.id]) continue;
          
          setCurrentChunk(chunk.id);
          
          // 각 서브청크별 번역 결과를 저장할 배열
          const translatedSubChunks: SubChunk[] = [];
          
          // 각 서브청크를 개별적으로 번역
          for (let i = 0; i < chunk.subChunks.length; i++) {
            const subChunk = chunk.subChunks[i];
            
            // API 할당량 초과 방지를 위한 딜레이
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
              // 시간 마커를 포함한 프롬프트 생성
              const prompt = `
Translate the following English text to Korean.
Context: This is part ${i + 1} of 4 from a larger text.
Requirements:
- Preserve the exact timestamp markers (e.g., (12:34))
- Maintain academic/professional tone
- Keep technical terms accurate
- Ensure natural Korean flow

Text to translate:
${subChunk.text}

Important:
1. Keep all timestamps in their original format
2. Maintain the same paragraph structure
3. Ensure this translation aligns naturally with the surrounding context
`;

              const response = await fetch('/api/translate-chunk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: prompt,
                  targetLanguage: 'Korean'
                })
              });

              if (!response.ok) {
                throw new Error(`Translation failed for subchunk ${i + 1}`);
              }

              const data = await response.json();
              translatedSubChunks.push({
                ...subChunk,
                translation: processText(data.translatedText)
              });

            } catch (subError) {
              console.error(`SubChunk translation error:`, subError);
              translatedSubChunks.push({
                ...subChunk,
                translation: `[번역 실패] ${subChunk.text}`
              });
            }
          }

          // 모든 서브청크의 번역을 순서대로 합침
          const completeTranslation = translatedSubChunks
            .map(subChunk => subChunk.translation)
            .filter(Boolean)
            .join('\n\n');
          
          // 번역 결과 저장
          await saveTranslationToDb(chunk.id, completeTranslation);
          setTranslations(prev => ({
            ...prev,
            [chunk.id]: completeTranslation
          }));

          // 매핑 업데이트
          setMappedParagraphs(prev => ({
            source: chunk.subChunks.map(subChunk => ({
              id: subChunk.id,
              text: subChunk.text,
              timeMarker: subChunk.timeMarker,
              isHighlighted: false,
              charCount: subChunk.text.length
            })),
            target: translatedSubChunks.map(subChunk => ({
              id: subChunk.id,
              text: subChunk.translation || '',
              timeMarker: subChunk.timeMarker,
              isHighlighted: false,
              charCount: (subChunk.translation || '').length
            }))
          }));
        }

        setStatus('completed');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
        console.error('Translation error:', err);
        setError(`번역 중 오류 발생: ${errorMessage}`);
        setStatus('error');
      } finally {
        setIsTranslating(false);
      }
    }

    translateChunks();
  }, [script.id]);

  // 문단 선택 핸들러 개선
  const handleParagraphClick = (id: number, isSource: boolean) => {
    console.log('Paragraph clicked:', { id, isSource });
    
    setMappedParagraphs(prev => {
      const newSource = prev.source.map(p => ({
        ...p,
        isHighlighted: p.id === id
      }));
      const newTarget = prev.target.map(p => ({
        ...p,
        isHighlighted: p.id === id
      }));

      return { source: newSource, target: newTarget };
    });

    // 선택된 문단을 양쪽 패널의 상단으로 스크롤
    const sourceElement = document.getElementById(`source-${id}`);
    const targetElement = document.getElementById(`target-${id}`);
    const sourceContainer = document.querySelector('.source-container');
    const targetContainer = document.querySelector('.target-container');

    if (sourceElement && targetElement && sourceContainer && targetContainer) {
      // 부드러운 스크롤 효과
      sourceContainer.scrollTo({
        top: sourceElement.offsetTop - sourceContainer.offsetTop - 20, // 20px 여백
        behavior: 'smooth'
      });

      targetContainer.scrollTo({
        top: targetElement.offsetTop - targetContainer.offsetTop - 20, // 20px 여백
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
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

      {/* Translation viewer */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setSelectedChunk(prev => Math.max(0, prev - 1))}
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
            </h3>
            <span className="text-sm text-gray-500">
              {chunks[selectedChunk]?.tokens.toLocaleString()} tokens
            </span>
          </div>
          <button
            onClick={() => setSelectedChunk(prev => Math.min(chunks.length - 1, prev + 1))}
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
          {/* Source text */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">원문</h3>
              <CopyButton 
                text={chunks[selectedChunk]?.text || ''} 
                label="원문"
              />
            </div>
            <div className="source-container prose max-w-none h-[600px] overflow-y-auto">
              {mappedParagraphs.source.map(paragraph => (
                <ParagraphBlock
                  key={`source-${paragraph.id}`}
                  paragraph={paragraph}
                  onClick={() => handleParagraphClick(paragraph.id, true)}
                  isHighlighted={paragraph.isHighlighted}
                  isSource={true}
                />
              ))}
            </div>
          </div>

          {/* Translation */}
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">번역</h3>
              {translations[selectedChunk] && (
                <CopyButton 
                  text={translations[selectedChunk]} 
                  label="번역"
                />
              )}
            </div>
            <div className="target-container prose max-w-none h-[600px] overflow-y-auto">
              {translations[selectedChunk] ? (
                mappedParagraphs.target.map(paragraph => (
                  <ParagraphBlock
                    key={`target-${paragraph.id}`}
                    paragraph={paragraph}
                    onClick={() => handleParagraphClick(paragraph.id, false)}
                    isHighlighted={paragraph.isHighlighted}
                    isSource={false}
                  />
                ))
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

      {/* Status indicators */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {isSaving && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            저장 중...
          </div>
        )}
        {status === 'completed' && !isSaving && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            모역 완료
          </div>
        )}
      </div>
    </div>
  )
} 