import { execSync } from 'child_process'

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const output = execSync('python3 /Users/travis/clawd/scripts/cost_tracker.py daily', {
      encoding: 'utf-8',
      timeout: 30000,
    })

    const lines = output.split('\n')
    const data: Record<string, any> = {}

    lines.forEach(line => {
      if (line.includes('Token 成本:')) {
        const match = line.match(/Token 成本: \$?([\d.]+)/)
        if (match) data.tokenCost = parseFloat(match[1])
      }
      if (line.includes('基礎設施:')) {
        const match = line.match(/基礎設施: \$?([\d.]+)/)
        if (match) data.infraCost = parseFloat(match[1])
      }
      if (line.includes('第三方服務:')) {
        const match = line.match(/第三方服務: \$?([\d.]+)/)
        if (match) data.thirdPartyCost = parseFloat(match[1])
      }
      if (line.includes('人力成本:')) {
        const match = line.match(/人力成本: \$?([\d.]+)/)
        if (match) data.laborCost = parseFloat(match[1])
      }
      if (line.includes('總成本:')) {
        const match = line.match(/總成本: \$?([\d.]+)/)
        if (match) data.totalCost = parseFloat(match[1])
      }
      if (line.includes('Monthly Token Budget')) {
        const match = line.match(/Monthly Token Budget: \$?([\d.]+)\/\$\d+\.\d+ \(([\d.]+)%\)/)
        if (match) {
          data.monthlyBudget = { used: parseFloat(match[1]), percentage: parseFloat(match[2]) }
        }
      }
      if (line.includes('Daily Token Budget')) {
        const match = line.match(/Daily Token Budget: \$?([\d.]+)\/\$\d+\.\d+ \(([\d.]+)%\)/)
        if (match) {
          data.dailyBudget = { used: parseFloat(match[1]), percentage: parseFloat(match[2]) }
        }
      }
    })

    return NextResponse.json({
      ...data,
      lastUpdate: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching cost data:', error)
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 })
  }
}
