import { NextResponse } from 'next/server'

const getSupabase = () => {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 計算 Markdown 檔案 token
function estimateTokens(text: string): number {
  // 粗估：中文約 1.5 token/字，英文約 4 token/word
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
  const otherChars = text.length - chineseChars - englishWords
  return Math.ceil(chineseChars * 1.5 + englishWords * 0.25 + otherChars * 1)
}

// 掃描目錄獲取檔案大小
function scanDirectory(dir: string, basePath: string): any[] {
  const fs = require('fs')
  const path = require('path')
  const files: any[] = []
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(basePath, fullPath)
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children: scanDirectory(fullPath, basePath)
        })
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const stats = fs.statSync(fullPath)
        files.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats.size,
          lines: content.split('\n').length,
          tokens: estimateTokens(content)
        })
      }
    }
  } catch (e) {
    console.error('Error scanning:', e)
  }
  
  return files
}

export async function GET() {
  const supabase = getSupabase()
  
  try {
    // 1. 過去 5 天每日使用量（依 LLM 分類）
    const { data: dailyByModel } = await supabase
      .from('token_usage')
      .select('date, model, total_tokens, cost_usd')
      .gte('date', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })
    
    // 2. 最近的事件記錄
    const { data: recentEvents } = await supabase
      .from('token_usage_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    // 3. 核心 AGENTS 檔案分析
    const agentsPath = process.env.AGENTS_PATH || '/Users/travis/clawd'
    const coreFiles = [
      'AGENTS.md', 'SOUL.md', 'USER.md', 'SYSTEM_STATUS.md', 
      'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md', 'IDENTITY.md'
    ]
    
    const coreFilesData = coreFiles.map(name => {
      const filePath = `${agentsPath}/${name}`
      try {
        const fs = require('fs')
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          const stats = fs.statSync(filePath)
          return {
            name,
            size: stats.size,
            lines: content.split('\n').length,
            tokens: estimateTokens(content)
          }
        }
      } catch (e) {}
      return { name, size: 0, lines: 0, tokens: 0 }
    })
    
    // 4. memory 目錄總覽
    const memoryPath = `${agentsPath}/memory`
    let memoryStats = { files: 0, totalSize: 0, totalTokens: 0 }
    try {
      const fs = require('fs')
      if (fs.existsSync(memoryPath)) {
        const files = scanDirectory(memoryPath, memoryPath)
        function countFiles(items: any[]) {
          for (const item of items) {
            if (item.type === 'file') {
              memoryStats.files++
              memoryStats.totalSize += item.size
              memoryStats.totalTokens += item.tokens
            } else if (item.children) {
              countFiles(item.children)
            }
          }
        }
        countFiles(files)
      }
    } catch (e) {}
    
    // 5. Cron jobs 估算
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
      dailyByModel,
      recentEvents,
      coreFiles: coreFilesData,
      memoryStats,
      cronJobs,
      cronDailyEstimate,
      summary: {
        coreFilesTotalTokens: coreFilesData.reduce((sum, f) => sum + f.tokens, 0),
        memoryTotalTokens: memoryStats.totalTokens,
        estimatedDailyTokens: cronDailyEstimate + coreFilesData.reduce((sum, f) => sum + f.tokens, 0) * 20
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
