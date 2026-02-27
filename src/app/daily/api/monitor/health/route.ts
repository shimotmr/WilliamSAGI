import fs from 'fs'
import path from 'path'

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const dataDir = path.join(process.env.HOME || '/Users/travis', 'clawd', 'data')
    const healthStatePath = path.join(dataDir, 'health', 'health_state.json')
    const healthHistoryPath = path.join(dataDir, 'health', 'health_history.json')
    const pipelineStatePath = path.join(dataDir, 'pipeline-state.json')

    const [healthState, healthHistory, pipelineState] = await Promise.all([
      fs.promises.readFile(healthStatePath, 'utf-8').then(JSON.parse).catch(() => null),
      fs.promises.readFile(healthHistoryPath, 'utf-8').then(JSON.parse).catch(() => []),
      fs.promises.readFile(pipelineStatePath, 'utf-8').then(JSON.parse).catch(() => null),
    ])

    return NextResponse.json({
      current: healthState?.last_health || null,
      previousLevel: healthState?.previous_level || null,
      levelChanged: healthState?.level_changed || false,
      history: healthHistory?.slice(-24) || [],
      pipeline: pipelineState,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching health data:', error)
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 })
  }
}
