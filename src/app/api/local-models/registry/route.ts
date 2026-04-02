import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'

const SOURCE_FILE = '/Users/travis/clawd/config/search_source_registry.json'
const TOPIC_FILE = '/Users/travis/clawd/config/search_topic_registry.json'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [sourceRaw, topicRaw] = await Promise.all([
      readFile(SOURCE_FILE, 'utf8'),
      readFile(TOPIC_FILE, 'utf8'),
    ])
    const sourcePayload = JSON.parse(sourceRaw)
    const topicPayload = JSON.parse(topicRaw)
    return NextResponse.json({
      ok: true,
      sources: sourcePayload.sources ?? [],
      topics: topicPayload.topics ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : '無法讀取 registry',
      },
      { status: 500 },
    )
  }
}
