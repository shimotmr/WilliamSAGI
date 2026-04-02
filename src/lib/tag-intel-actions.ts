export type IntelTaskMode = 'hit' | 'recommendation'

export type IntelTaskInput = {
  mode: IntelTaskMode
  label?: string | null
  title?: string | null
  url?: string | null
  source?: string | null
  query?: string | null
  reason?: string | null
  trackingGroup?: string | null
  linkedDomain?: string | null
}

export type IntelTaskPayload = {
  title: string
  assignee: string
  priority: string
  description: string
  acceptanceCriteria: string
  dispatchPrompt: string
  dispatchModel: string
  executionType: string
  taskType: string
  complexity: string
}

function compact(value?: string | null) {
  return String(value || '').trim()
}

export function buildIntelTaskPayload(input: IntelTaskInput): IntelTaskPayload {
  const mode = input.mode
  const source = compact(input.source) || 'intel'
  const titleBase = compact(input.title) || compact(input.label) || compact(input.query) || '未命名情報'
  const trackingGroup = compact(input.trackingGroup)
  const linkedDomain = compact(input.linkedDomain)
  const contextLine = [
    trackingGroup ? `追蹤群組：${trackingGroup}` : '',
    linkedDomain ? `官網：${linkedDomain}` : '',
    compact(input.url) ? `來源 URL：${compact(input.url)}` : '',
    compact(input.query) ? `查詢：${compact(input.query)}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  if (mode === 'recommendation') {
    return {
      title: `[Intel][建議追蹤] ${titleBase}`.slice(0, 120),
      assignee: 'rex',
      priority: 'P2',
      description: [
        `來自 Tag Intel 的建議追蹤項目：${titleBase}`,
        `來源：${source}`,
        compact(input.reason) ? `原因：${compact(input.reason)}` : '',
        contextLine,
      ]
        .filter(Boolean)
        .join('\n'),
      acceptanceCriteria:
        '1. 確認此追蹤項目是否值得納入正式 watchlist 2. 補充推薦來源/帳號/網站 3. 給出後續 collector 或追蹤策略建議 4. 完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> 摘要',
      dispatchPrompt: [
        `請評估 Tag Intel 建議追蹤項目「${titleBase}」是否值得納入正式追蹤。`,
        '',
        '請完成：',
        '1. 確認此項目屬於主題、競品、帳號、網站或技能追蹤哪一類',
        '2. 補充建議的 watch accounts / watch sites / topics / tag groups',
        '3. 判斷是否需要建立固定 collector 策略',
        '4. 產出一段可直接回填 Search Intel 的建議摘要',
        '',
        contextLine,
        '',
        '完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> "Tag Intel 建議追蹤評估完成：一句話結論"',
      ]
        .filter(Boolean)
        .join('\n'),
      dispatchModel: 'zai/glm-5.1',
      executionType: 'subagent',
      taskType: 'intel_followup',
      complexity: 'medium',
    }
  }

  return {
    title: `[Intel][追查] ${titleBase}`.slice(0, 120),
    assignee: 'rex',
    priority: 'P1',
    description: [
      `來自 Tag Intel 的高價值命中內容：${titleBase}`,
      `來源：${source}`,
      contextLine,
      compact(input.reason) ? `備註：${compact(input.reason)}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    acceptanceCriteria:
      '1. 完成最小追查並確認這則內容對系統的價值 2. 判斷應歸類為技能、案例、競品更新或資料來源 3. 給出下一步建議（建卡/追蹤/忽略） 4. 完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> 摘要',
    dispatchPrompt: [
      `請追查這筆 Tag Intel 命中內容：「${titleBase}」。`,
      '',
      '請完成：',
      '1. 摘要內容重點與可信度',
      '2. 判斷它對 OpenClaw / Search Intel / 技能系統有何實際價值',
      '3. 若值得跟進，提出具體後續（研究卡、實作卡、追蹤群組、來源接入）',
      '4. 請明確標註是否建議加入 watchlist 或作為案例/技能資料',
      '',
      contextLine,
      '',
      '完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> "Tag Intel 內容追查完成：一句話結論"',
    ]
      .filter(Boolean)
      .join('\n'),
    dispatchModel: 'zai/glm-5.1',
    executionType: 'subagent',
    taskType: 'intel_investigation',
    complexity: 'medium',
  }
}

