// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.content && !body.message) {
      return NextResponse.json({ error: 'Missing content or message' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const record = {
      content: body.content || body.message || '',
      sender_name: body.sender_name || body.from || 'unknown',
      sender_id: body.sender_id || body.user_id || null,
      msg_type: body.msg_type || body.type || 'text',
      company: body.company || null,
      send_time: body.send_time || new Date().toISOString(),
      raw_data: body,
    }

    const { data, error } = await supabase
      .from('wecom_messages')
      .insert(record)
      .select()

    if (error) {
      console.error('Wecom webhook DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id })
  } catch (e: any) {
    console.error('Wecom webhook error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const company = searchParams.get('company') || ''
  const limit = parseInt(searchParams.get('limit') || '100')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from('wecom_messages')
    .select('*')
    .order('send_time', { ascending: false })
    .limit(limit)

  if (q) query = query.or(`content.ilike.%${q}%,sender_name.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data || [] })
}
