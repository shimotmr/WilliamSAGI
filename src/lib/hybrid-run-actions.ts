export type HybridRunTaskInput = {
  query?: string | null
  sources?: string[] | null
  topics?: string[] | null
  classificationLevel?: string | null
  classificationRoute?: string | null
  createdAt?: string | null
}

export type HybridRunTaskPayload = {
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

function joinItems(values?: string[] | null) {
  return Array.isArray(values) ? values.map((item) => compact(item)).filter(Boolean).join('、') : ''
}

export function buildHybridRunTaskPayload(input: HybridRunTaskInput): HybridRunTaskPayload {
  const query = compact(input.query) || '未命名混合研究'
  const sources = joinItems(input.sources) || '未指定來源'
  const topics = joinItems(input.topics) || '未指定主題'
  const level = compact(input.classificationLevel) || '未分類'
  const route = compact(input.classificationRoute) || '未判定'
  const createdAt = compact(input.createdAt)

  const context = [
    `查詢：${query}`,
    `來源：${sources}`,
    `主題：${topics}`,
    `優先等級：${level}`,
    `路由判定：${route}`,
    createdAt ? `紀錄時間：${createdAt}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    title: `[Intel][Hybrid追查] ${query}`.slice(0, 120),
    assignee: 'rex',
    priority: 'P1',
    description: [
      '來自 Search Intel 的混合研究紀錄，需要追查後決定是否轉為正式追蹤或任務。',
      context,
    ]
      .filter(Boolean)
      .join('\n'),
    acceptanceCriteria:
      '1. 追查這筆混合研究紀錄的實際價值 2. 判斷是否應轉成正式追蹤設定、研究卡或實作卡 3. 補一段可直接回填 Search Intel 的中文建議 4. 完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> 摘要',
    dispatchPrompt: [
      `請追查這筆 Search Intel 混合研究紀錄：「${query}」。`,
      '',
      '請完成：',
      '1. 先確認這筆查詢的主要發現與可信度',
      '2. 判斷這筆內容是否值得轉成正式追蹤、研究卡或實作卡',
      '3. 若值得跟進，具體說明建議的 watch sites / watch accounts / topics / tag groups',
      '4. 產出一段可直接回填 Search Intel 的中文摘要',
      '',
      context,
      '',
      '完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> "Hybrid Run 追查完成：一句話結論"',
    ].join('\n'),
    dispatchModel: 'zai/glm-5.1',
    executionType: 'subagent',
    taskType: 'intel_investigation',
    complexity: 'medium',
  }
}
