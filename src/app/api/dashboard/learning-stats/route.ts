// @ts-nocheck
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const learningsDir = '/Users/travis/clawd/memory/knowledge/learnings'
    
    // Check if directory exists
    if (!fs.existsSync(learningsDir)) {
      return NextResponse.json({ 
        ok: true, 
        totalLearnings: 0,
        weeklyGrowth: [],
        error: 'Learnings directory not found'
      })
    }

    // Get all files in learnings directory
    const files = fs.readdirSync(learningsDir)
    const fileStats = files.map(file => {
      const filePath = path.join(learningsDir, file)
      const stat = fs.statSync(filePath)
      return {
        name: file,
        created: stat.birthtime,
        modified: stat.mtime
      }
    })

    // Calculate weekly growth for last 4 weeks
    const weeklyGrowth: Record<string, { week: string; count: number }> = {}

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const weekKey = weekStart.toISOString().split('T')[0]
      weeklyGrowth[weekKey] = { week: weekKey, count: 0 }
    }

    // Count files created in each week
    for (const file of fileStats) {
      const fileDate = new Date(file.created)
      const weekStart = new Date(fileDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (weeklyGrowth[weekKey]) {
        weeklyGrowth[weekKey].count += 1
      }
    }

    const weeklyData = Object.values(weeklyGrowth)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map(w => ({
        week: w.week,
        count: w.count
      }))

    // Total learnings
    const totalLearnings = fileStats.length

    // Recent learnings (last 5)
    const recentLearnings = fileStats
      .sort((a, b) => b.created.getTime() - a.created.getTime())
      .slice(0, 5)
      .map(f => ({
        name: f.name,
        created: f.created.toISOString().split('T')[0]
      }))

    return NextResponse.json({ 
      ok: true, 
      totalLearnings,
      weeklyGrowth: weeklyData,
      recentLearnings
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      ok: false
    }, { status: 500 })
  }
}
