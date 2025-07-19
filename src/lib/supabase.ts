import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// データベース型定義
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          open_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          open_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          open_date?: string | null
          updated_at?: string
        }
      }
      people: {
        Row: {
          id: string
          first_name: string
          last_name: string
          bg_color: string
          text_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          bg_color: string
          text_color: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          bg_color?: string
          text_color?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          name: string
          start_date: string
          end_date: string
          progress: number
          assigned_person_id: string | null
          category: string
          is_local: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          start_date: string
          end_date: string
          progress?: number
          assigned_person_id?: string | null
          category: string
          is_local?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          start_date?: string
          end_date?: string
          progress?: number
          assigned_person_id?: string | null
          category?: string
          is_local?: boolean
          updated_at?: string
        }
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          name: string
          completed: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          name: string
          completed?: boolean
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          name?: string
          completed?: boolean
          order_index?: number
          updated_at?: string
        }
      }
    }
  }
}
