import { NextResponse } from 'next/server'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const BRIDGE_SCRIPT = '/Users/travis/clawd/scripts/offline_model_web_bridge.py'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { stdout } = await execFileAsync('python3', [BRIDGE_SCRIPT, '--list-skills'], {
      timeout: 15000,
      maxBuffer: 1024 * 1024,
    })
    const parsed = JSON.parse(stdout)
    return NextResponse.json({ skills: parsed.skills ?? [] })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '無法取得 skills 清單',
      },
      { status: 500 },
    )
  }
}
