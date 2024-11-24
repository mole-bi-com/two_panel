import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export const createServerClient = async () => {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  return supabase
}

// Ensure this function is only used in server components
export const getScriptById = async (scriptId: string) => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('scripts').select('*').eq('script_id', scriptId).single()

  if (error) {
    console.error('Error fetching script:', error)
    return null
  }

  return data
}

// Function to create a new script
export const createScript = async (scriptData: Omit<Script, 'script_id' | 'creation_date' | 'updated_at'>) => {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('scripts').insert([scriptData]).select().single()

  if (error) {
    console.error('Error creating script:', error)
    return null
  }

  return data
}

export async function saveTranslation(translationId: string, chunkId: number, translatedText: string) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data, error } = await supabase
    .from('translation_chunks')
    .upsert({
      translation_id: translationId,
      chunk_id: chunkId,
      translated_content: translatedText,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving translation:', error)
    throw error
  }

  return data
} 