import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('reports')
    .select('id,title,author,type,created_at')
    .or('title.ilike.%人形%,title.ilike.%機器人%,title.ilike.%robot%,title.ilike.%humanoid%')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ reports: data || [] })
}
