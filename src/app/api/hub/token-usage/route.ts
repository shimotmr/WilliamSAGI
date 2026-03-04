import { NextResponse } from 'next/server'

const getSupabase = () => {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()
  
  try {
    // 1. 從資料庫讀取所有檔案分析
    const { data: allFiles } = await supabase
      .from('file_context_analysis')
      .select('*')
      .order('tokens', { ascending: false })
    
    // 2. 分類
    const coreFiles = allFiles?.filter((f: any) => f.name.endsWith('.md') && !f.path?.startsWith('memory/')) || []
    const memoryFiles = allFiles?.filter((f: any) => f.path?.startsWith('memory/')) || []
    
    // 3. 過去 5 天每日使用量
    const { data: dailyByModel } = await supabase
      .from('token_usage')
      .select('date, model, total_tokens, cost_usd')
      .gte('date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })
    
    const cronJobs = [
      { name: 'system-health', frequency: 48, tokensPerRun: 500 },
      { name: 'sync-cases-daily', frequency: 1, tokensPerRun: 2000 },
      { name: 'audit-database-daily', frequency: 1, tokensPerRun: 1000 },
      { name: 'audit-credentials', frequency: 1, tokensPerRun: 800 },
      { name: 'daily-cost-report', frequency: 1, tokensPerRun: 1500 },
    ]
    
    const cronDailyEstimate = cronJobs.reduce((sum, job) => 
      sum + job.frequency * job.tokensPerRun, 0)
    
    return NextResponse.json({
      coreFiles,
      memoryFiles,
      memoryStats: {
        files: memoryFiles.length,
        totalSize: memoryFiles.reduce((s: any, f: any) => s + (f.size || 0), 0),
        totalTokens: memoryFiles.reduce((s: any, f: any) => s + (f.tokens || 0), 0),
      },
      dailyByModel,
      cronJobs,
      cronDailyEstimate,
      summary: {
        coreFilesTotalTokens: coreFiles.reduce((s: any, f: any) => s + (f.tokens || 0), 0),
        memoryTotalTokens: memoryFiles.reduce((s: any, f: any) => s + (f.tokens || 0), 0),
        estimatedDailyTokens: cronDailyEstimate + coreFiles.reduce((s: any, f: any) => s + (f.tokens || 0), 0) * 20
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
