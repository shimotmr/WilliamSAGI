// @ts-nocheck
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAdminList, addAdmin, removeAdmin } from '@/lib/admins'

export async function GET() {
  const cookieStore = await cookies()
  const cookieEmail = cookieStore.get('user_email')?.value
  if (!cookieEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admins = await getAdminList()
  return NextResponse.json({ admins })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const result = await addAdmin(body)
  return NextResponse.json(result)
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const result = await removeAdmin(id)
  return NextResponse.json(result)
}
