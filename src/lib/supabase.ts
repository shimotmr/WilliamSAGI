import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key-placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Message = {
  id: string
  thread_id: string
  sender: string
  content: string
  timestamp: string
  message_type?: string
  metadata?: any
}

export type Thread = {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  created_by: string
  is_active: boolean
  message_count?: number
  task_id?: number
  task_title?: string
}