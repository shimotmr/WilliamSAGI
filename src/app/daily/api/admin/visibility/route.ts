import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// Initialize Supabase only if env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === process.env.ADMIN_TOKEN
}

// GET: 列出所有文章的 visibility 設定
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }
  
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('post_visibility')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

// PATCH: 更新文章 visibility
export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }
  
  if (!verifyAdminToken(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { slug, visibility, markdown_api, updated_by } = body

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing slug' },
      { status: 400 }
    )
  }

  const updates: any = {
    updated_at: new Date().toISOString(),
  }

  if (visibility) {
    if (!['public', 'private', 'vip'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Invalid visibility value' },
        { status: 400 }
      )
    }
    updates.visibility = visibility
  }

  if (markdown_api !== undefined) {
    updates.markdown_api = markdown_api
  }

  if (updated_by) {
    updates.updated_by = updated_by
  }

  const { data, error } = await supabase
    .from('post_visibility')
    .upsert({ slug, ...updates })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
