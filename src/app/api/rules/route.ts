import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


export interface RuleItem {
  name: string
  level: 'RED' | 'YELLOW' | 'GREEN'
  status: 'complete' | 'partial' | 'dead'
  statusIcon: string
  bindingScore: number
  maxScore: number
  hasBindingSection: boolean
  hasTrigger: boolean
  hasExecutor: boolean
  hasVerification: boolean
  missingElements: string[]
  lastExecuted?: string
}

export interface RuleSummary {
  totalRules: number
  completeBinding: number
  partialBinding: number
  deadRules: number
  complianceRate: number
  lastScanTime: string
  rules: RuleItem[]
}

// Map status to icon
function getStatusIcon(status: string): string {
  switch (status) {
    case 'complete': return '✅'
    case 'partial': return '⚠️'
    case 'dead': return '❌'
    default: return '❓'
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      const fallbackData: RuleSummary = {
        totalRules: 0,
        completeBinding: 0,
        partialBinding: 0,
        deadRules: 0,
        complianceRate: 0,
        lastScanTime: new Date().toISOString(),
        rules: []
      }
      return NextResponse.json(fallbackData)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch from Supabase
    const { data: rules, error } = await supabase
      .from('rule_compliance')
      .select('*')
      .order('scanned_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!rules || rules.length === 0) {
      // Return empty structure if no data
      const fallbackData: RuleSummary = {
        totalRules: 0,
        completeBinding: 0,
        partialBinding: 0,
        deadRules: 0,
        complianceRate: 0,
        lastScanTime: new Date().toISOString(),
        rules: []
      }
      return NextResponse.json(fallbackData)
    }

    // Get the most recent scan time
    const lastScanTime = rules[0]?.scanned_at || new Date().toISOString()

    // Calculate statistics
    const completeBinding = rules.filter(r => r.status === 'complete').length
    const partialBinding = rules.filter(r => r.status === 'partial').length
    const deadRules = rules.filter(r => r.status === 'dead').length
    const totalRules = rules.length
    const complianceRate = totalRules > 0 ? (completeBinding / totalRules) * 100 : 0

    // Map to RuleItem format
    const ruleItems: RuleItem[] = rules.map(rule => ({
      name: rule.rule_name,
      level: rule.level as 'RED' | 'YELLOW' | 'GREEN',
      status: rule.status as 'complete' | 'partial' | 'dead',
      statusIcon: getStatusIcon(rule.status),
      bindingScore: rule.binding_score,
      maxScore: rule.max_score,
      hasBindingSection: rule.has_binding_section,
      hasTrigger: rule.has_trigger,
      hasExecutor: rule.has_executor,
      hasVerification: rule.has_verification,
      missingElements: rule.missing_elements || [],
      lastExecuted: undefined
    }))

    // Sort rules: RED -> YELLOW -> GREEN, then by status
    ruleItems.sort((a, b) => {
      const levelOrder = { RED: 0, YELLOW: 1, GREEN: 2 }
      const levelDiff = levelOrder[a.level] - levelOrder[b.level]
      if (levelDiff !== 0) return levelDiff
      
      const statusOrder = { dead: 0, partial: 1, complete: 2 }
      return statusOrder[a.status] - statusOrder[b.status]
    })

    const summary: RuleSummary = {
      totalRules,
      completeBinding,
      partialBinding,
      deadRules,
      complianceRate,
      lastScanTime,
      rules: ruleItems
    }

    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('Error in /api/rules:', error)
    
    // Return empty structure on error
    const fallbackData: RuleSummary = {
      totalRules: 0,
      completeBinding: 0,
      partialBinding: 0,
      deadRules: 0,
      complianceRate: 0,
      lastScanTime: new Date().toISOString(),
      rules: []
    }
    
    return NextResponse.json(fallbackData, { 
      status: 200,
      headers: {
        'X-Error': 'Failed to fetch rules data'
      }
    })
  }
}
