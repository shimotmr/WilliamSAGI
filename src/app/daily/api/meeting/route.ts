import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// Updated agent names: Travis, Blake, Rex, Oscar, Warren, Griffin
const AGENTS: Record<string, { name: string; avatar: string }> = {
  travis: { name: 'Travis', avatar: '/avatars/travis.png' },
  blake: { name: 'Blake', avatar: '/avatars/blake.png' },
  rex: { name: 'Rex', avatar: '/avatars/rex.png' },
  oscar: { name: 'Oscar', avatar: '/avatars/oscar.png' },
  warren: { name: 'Warren', avatar: '/avatars/warren.png' },
  griffin: { name: 'Griffin', avatar: '/avatars/griffin.png' },
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get('meeting') || 'general'
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('meeting_messages')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { meeting_id, content, agent_id } = body

  if (!content) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  const supabase = getSupabase()

  if (agent_id) {
    const auth = req.headers.get('authorization')
    const token = process.env.AGENT_COMMENT_TOKEN
    if (!token || auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const agent = AGENTS[agent_id]
    if (!agent) {
      return NextResponse.json({ error: 'unknown agent_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('meeting_messages')
      .insert({
        meeting_id: meeting_id || 'general',
        user_name: agent.name,
        user_avatar: agent.avatar,
        content,
        agent_id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'use supabase client for user messages' }, { status: 400 })
}
