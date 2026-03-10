import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 延遲檢查，避免 build 時報錯
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing public Supabase environment variables')
    }
    if (!supabaseInstance) {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    }
    return Reflect.get(supabaseInstance, prop)
  }
})
