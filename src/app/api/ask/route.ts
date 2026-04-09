import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const RAG_QUERY_SCRIPT = '/Users/travis/clawd/scripts/rag_query.py'
const PYTHON_BIN = '/opt/homebrew/bin/python3'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: '缺少 query 參數' }, { status: 400 })
    }

    const args = [RAG_QUERY_SCRIPT, query]

    const { stdout, stderr } = await execFileAsync(PYTHON_BIN, args, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 2,
    })

    let result
    try {
      result = JSON.parse(stdout.trim())
    } catch (e) {
      result = { query, error: '解析 RAG 結果失敗', raw: stdout.trim() }
    }

    if (stderr) {
      console.warn('RAG stderr:', stderr)
    }

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('RAG /api/ask error:', error)
    return NextResponse.json({
      ok: false,
      error: error.message || 'RAG 查詢失敗',
      source: 'llamaindex_fallback'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ error: '缺少 q 參數，使用 ?q=你的問題' }, { status: 400 })
  }

  // For GET, simulate POST body
  return POST(new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: { 'Content-Type': 'application/json' }
  }) as any)
}
