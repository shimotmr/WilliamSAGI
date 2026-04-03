import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { authCookieName, verifySession } from '@/lib/auth/session'

const execFileAsync = promisify(execFile)
const UPDATE_SCRIPT = '/Users/travis/clawd/scripts/update_intelligence_check.sh'
const DATASET_PATH = '/Users/travis/WilliamSAGI/public/data/update-intelligence-latest.json'

export const dynamic = 'force-dynamic'

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) return NextResponse.json({ ok: false, error: '未登入' }, { status: 401 })
  const session = await verifySession(token)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ ok: false, error: '需要管理員權限' }, { status: 403 })
  }
  return null
}

async function loadGeneratedAt() {
  const raw = await fs.readFile(DATASET_PATH, 'utf-8')
  const json = JSON.parse(raw)
  return {
    generatedAt: json?.generatedAt || null,
    totalTargets: json?.summary?.totalTargets || 0,
  }
}

export async function POST() {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const before = await loadGeneratedAt()
    const { stdout, stderr } = await execFileAsync('/bin/bash', [UPDATE_SCRIPT], {
      cwd: path.dirname(UPDATE_SCRIPT),
      timeout: 1000 * 60 * 10,
      maxBuffer: 1024 * 1024 * 8,
    })
    const after = await loadGeneratedAt()

    return NextResponse.json({
      ok: true,
      before,
      after,
      stdout: stdout.trim() || null,
      stderr: stderr.trim() || null,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '升級資料更新失敗' },
      { status: 500 }
    )
  }
}
