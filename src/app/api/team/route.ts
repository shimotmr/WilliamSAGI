// @ts-nocheck
import { verifySession, authCookieName } from '@/lib/auth/session'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {  // Auth guard
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const session = await verifySession(token)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })


  const getSupabase = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  const { data } = await getSupabase().from('team').select('*').order('name')
  return NextResponse.json({ team: data || [], data: data || [] })
}
