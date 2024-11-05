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
          script_id: string
          user_id: string
          title: string
          original_content: string
          translated_content: string | null
          creation_date: string
          updated_at: string
        }
        Insert: {
          script_id?: string
          user_id: string
          title: string
          original_content: string
          translated_content?: string | null
          creation_date?: string
          updated_at?: string
        }
        Update: {
          script_id?: string
          user_id?: string
          title?: string
          original_content?: string
          translated_content?: string | null
          creation_date?: string
          updated_at?: string
        }
      }
    }
  }
} 