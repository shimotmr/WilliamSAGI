import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  let query = supabase.from('employees').select('*').order('department').order('name')
  if (q) query = query.or(`name.ilike.%${q}%,department.ilike.%${q}%,position.ilike.%${q}%,email.ilike.%${q}%`)
  const { data, error } = await query.limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employees: data })
}
