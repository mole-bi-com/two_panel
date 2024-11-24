export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      scripts: {
        Row: {
          id: string
          title: string
          original_content: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          original_content: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          original_content?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      translations: {
        Row: {
          id: string
          script_id: string
          user_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          script_id: string
          user_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          script_id?: string
          user_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      translation_chunks: {
        Row: {
          id: string
          translation_id: string
          chunk_id: number
          translated_content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          translation_id: string
          chunk_id: number
          translated_content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          translation_id?: string
          chunk_id?: number
          translated_content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 