// @ts-nocheck
// 🔒 AUDIT: 2026-03-08 | score=100/100 | full-audit
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
  }

  // Fetch report by ID
  const { data: report, error } = await getSupabase()
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Return in format expected by the page
  return NextResponse.json({
    id: report.id,
    title: report.title,
    date: report.date || report.created_at,
    author: report.author,
    type: 'md',
    md_content: report.md_content || '',
    source: 'supabase',
  })
}
