import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getCallerRole() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch (e) {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch (e) {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null }
  const serviceClient = getServiceClient()
  const { data } = await serviceClient
    .from('travis_daily_users')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  return { user, role: data?.role }
}

// GET: list all users (owner only)
export async function GET() {
  const { role } = await getCallerRole()
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceClient = getServiceClient()
  const { data, error } = await serviceClient
    .from('travis_daily_users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

// PATCH: update user role (owner only)
export async function PATCH(request: NextRequest) {
  const { role: callerRole } = await getCallerRole()
  if (callerRole !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { userId, newRole } = body

  if (!userId || !['member', 'pending'].includes(newRole)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  const serviceClient = getServiceClient()
  const { error } = await serviceClient
    .from('travis_daily_users')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
