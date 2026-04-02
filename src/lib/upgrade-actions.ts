import { promises as fs } from 'fs'
import path from 'path'

export type UpgradeItem = {
  id: string
  name: string
  category: 'model' | 'tool' | 'package' | 'skill' | 'extension' | 'frontend' | 'api'
  subcategory: string
  tags: string[]
  currentVersion?: string | null
  latestVersion?: string | null
  support: { level: string; note: string }
  recommendation: { label: string; why: string[] }
  summary: string
  nextActions?: string[]
  risk?: { negativeSignals?: string[] }
}

export type UpgradeTaskPayload = {
  title: string
  assignee: string
  priority: string
  board: string
  status: string
  approval_status: string
  description: string
  acceptance_criteria: string
  dispatch_prompt: string
  dispatch_model: string
  execution_type: string
  task_type: string
  complexity: string
}

export async function loadUpgradeDataset(): Promise<{ items: UpgradeItem[] }> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'update-intelligence-latest.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

function assigneeForItem(item: UpgradeItem, mode: 'followup' | 'smoke') {
  if (mode === 'smoke') {
    if (item.category === 'model' || item.category === 'api' || item.category === 'skill') {
      return { assignee: 'rex', model: 'zai/glm-5.1', execution: 'subagent' }
    }
    return { assignee: 'blake', model: 'openai-codex/gpt-5.4', execution: 'claude_code' }
  }

  if (item.category === 'frontend' || item.category === 'tool' || item.category === 'package' || item.category === 'extension') {
    return { assignee: 'blake', model: 'openai-codex/gpt-5.4', execution: 'claude_code' }
  }
  return { assignee: 'rex', model: 'zai/glm-5.1', execution: 'subagent' }
}

function priorityForItem(item: UpgradeItem, mode: 'followup' | 'smoke') {
  if (mode === 'smoke') return 'P2'
  if (item.recommendation.label === '安全疑慮') return 'P1'
  if (item.recommendation.label === '等待OpenClaw支援') return 'P2'
  if ((item.nextActions || []).length >= 3) return 'P1'
  return 'P2'
}

function actionTitle(item: UpgradeItem, mode: 'followup' | 'smoke') {
  if (mode === 'smoke') return `[Smoke][Upgrade] ${item.name} 最小驗證`
  if (item.recommendation.label === '安全疑慮') return `[Upgrade][安全] 審查 ${item.name}`
  return `[Upgrade] 評估 / 收斂 ${item.name}`
}

export function buildUpgradeTaskPayload(item: UpgradeItem, mode: 'followup' | 'smoke'): UpgradeTaskPayload {
  const role = assigneeForItem(item, mode)
  const priority = priorityForItem(item, mode)
  const title = actionTitle(item, mode)
  const versionLine = `${item.currentVersion || '—'} → ${item.latestVersion || '—'}`
  const actions = (item.nextActions || []).map((action) => `- ${action}`).join('\n')
  const risks = (item.risk?.negativeSignals || []).slice(0, 5).map((signal) => `- ${signal}`).join('\n')

  const description =
    mode === 'smoke'
      ? `[升級中心/${item.category}] 針對 ${item.name} 做最小 smoke 驗證。\n版本：${versionLine}\n支援：${item.support.level} / ${item.support.note}\n摘要：${item.summary}\n\n建議下一步：\n${actions || '- 檢查最新版本、支援程度與最小可行驗證'}\n\n風險訊號：\n${risks || '- 目前無額外負面訊號'}`
      : `[升級中心/${item.category}] 評估 ${item.name} 是否值得升級、延後、替換或恢復。\n版本：${versionLine}\n建議標籤：${item.recommendation.label}\n摘要：${item.summary}\n\n建議下一步：\n${actions || '- 產出一份明確建議與可執行方案'}\n\n風險訊號：\n${risks || '- 目前無額外負面訊號'}`

  const acceptance =
    mode === 'smoke'
      ? '1. 完成最小 smoke test 2. 明確記錄成功/失敗與錯誤類型 3. 說明目前 OpenClaw 是否可用 4. 完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> 完成摘要'
      : '1. 產出升級建議（立即升/延後/替換/維持） 2. 說明 OpenClaw 支援真相與風險 3. 必要時提出 fallback/替代方案 4. 完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> 完成摘要'

  const dispatch_prompt =
    mode === 'smoke'
      ? `針對 ${item.name} 做最小 smoke 驗證。\n\n範圍：\n1. 確認目前版本與可見最新版本\n2. 驗證目前 OpenClaw / 本地環境是否真的支援\n3. 做最小可行 smoke test（CLI / API / config / model listing / build / docs 任選最小閉環）\n4. 如果失敗，必須明確寫出失敗類型、關鍵錯誤、是否應停止自動升級\n\n輸出：\n- 一段可直接放回升級中心的結論\n- 具體錯誤訊息\n- 是否建議恢復、延後、替換\n\n完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> "Smoke 完成：成功/失敗與原因摘要"`
      : `評估 ${item.name} 的升級或替換策略。\n\n請完成：\n1. 確認目前版本差距與最新能力\n2. 說明是否有 breaking risk / 安全疑慮 / 社群負評\n3. 比對目前 OpenClaw 是否真的支援\n4. 若更適合 Mac mini / macOS，請說明原因\n5. 若應改用其他工具/模型/外掛，請明確提出替代方案\n\n最後請整理成可執行結論：\n- 立即升級 / 延後 / 維持 / 替換 / 從備份恢復\n\n完成後執行 ~/clawd/scripts/task_complete.sh <TASK_ID> "升級評估完成：一句話結論"`

  return {
    title,
    assignee: role.assignee,
    priority,
    board: 'agent',
    status: '待執行',
    approval_status: '自動批准',
    description,
    acceptance_criteria: acceptance,
    dispatch_prompt,
    dispatch_model: role.model,
    execution_type: role.execution,
    task_type: mode === 'smoke' ? 'upgrade_smoke' : 'upgrade_followup',
    complexity: mode === 'smoke' ? 'medium' : 'high',
  }
}
