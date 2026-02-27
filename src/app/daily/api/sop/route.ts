import { NextRequest, NextResponse } from 'next/server'

// 動態導入以避免構建時錯誤
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

export const dynamic = 'force-dynamic'

// 嘗試動態創建 client

// 模擬合規數據 (實際會從數據庫獲取)
const mockComplianceData = {
  overall_score: 85.0,
  total_checks: 6,
  passed: 5,
  warnings: 1,
  failed: 0,
  skipped: 0,
  last_check: new Date().toISOString(),
  results: [
    {
      category: 'task_status',
      check_name: 'task_status_consistency',
      level: 'pass',
      message: '所有任務狀態一致 (共 45 個任務)',
      details: { total_tasks: 45 }
    },
    {
      category: 'task_status',
      check_name: 'derivative_task_creation',
      level: 'pass',
      message: '衍生任務建卡流程正常',
      details: { total_derivative: 8 }
    },
    {
      category: 'task_status',
      check_name: 'task_stagnation',
      level: 'warning',
      message: '發現 2 個任務停擺超過 7 天',
      details: { stagnant_count: 2 }
    },
    {
      category: 'report_delivery',
      check_name: 'report_delivery_rate',
      level: 'pass',
      message: '報告交付成功率: 95.0%',
      details: { success_rate: 95, delivered: 19, pending: 1, failed: 0 }
    },
    {
      category: 'quality_control',
      check_name: 'quality_metrics',
      level: 'pass',
      message: '品質控制正常',
      details: { recent_incidents: 3 }
    },
    {
      category: 'meeting_process',
      check_name: 'meeting_phase_tracking',
      level: 'pass',
      message: '議事廳流程正常',
      details: { session_count: 10 }
    }
  ]
}

const mockTaskMetrics = {
  total: 45,
  completed: 32,
  in_progress: 8,
  blocked: 2,
  cancelled: 3,
  completion_rate: 71.1,
  avg_completion_time: 36.5
}

const mockReportMetrics = {
  total: 20,
  delivered: 19,
  pending: 1,
  failed: 0,
  success_rate: 95.0,
  avg_delivery_time: 4.2
}

const mockQualityMetrics = {
  total_incidents: 12,
  resolved: 10,
  unresolved: 2,
  critical: 0,
  resolution_rate: 83.3,
  avg_resolution_time: 2.5
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'summary'
    
    // 嘗試連接 Supabase (動態導入避免構建錯誤)
    let supabase = null
    if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://example.supabase.co') {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        supabase = createClient(supabaseUrl, supabaseKey)
      } catch (e) {
        console.log('Supabase not available:', e)
      }
    }
    
    switch (type) {
      case 'compliance':
        // 嘗試從數據庫獲取，失敗則使用 mock
        if (supabase) {
          try {
            // 這裡可以添加實際的數據庫查詢
            // const { data } = await supabase.from('compliance_logs').select('*').order('created_at', { ascending: false }).limit(1)
          } catch (e) {
            // 表可能不存在
          }
        }
        return NextResponse.json(mockComplianceData)
      
      case 'tasks':
        return NextResponse.json(mockTaskMetrics)
      
      case 'reports':
        return NextResponse.json(mockReportMetrics)
      
      case 'quality':
        return NextResponse.json(mockQualityMetrics)
      
      case 'summary':
      default:
        return NextResponse.json({
          compliance: mockComplianceData,
          tasks: mockTaskMetrics,
          reports: mockReportMetrics,
          quality: mockQualityMetrics,
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('SOP API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
