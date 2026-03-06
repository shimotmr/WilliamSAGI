/**
 * Event Trigger Engine - Phase 1
 * 
 * 事件類型：
 * - task_completed: 任務完成 → 自動通知
 * - deployment_failed: 部署失敗 → 自動建修復任務
 * - high_token_usage: Token 過高 → 告警
 */

export type EventType = 'task_completed' | 'deployment_failed' | 'high_token_usage'

export interface EventPayload {
  type: EventType
  timestamp: string
  data: Record<string, unknown>
}

export interface EventAction {
  action: 'notify' | 'create_task' | 'alert'
  target: string
  message: string
  metadata?: Record<string, unknown>
}

export interface EventRule {
  type: EventType
  name: string
  description: string
  enabled: boolean
  threshold?: number
  handler: (payload: EventPayload) => EventAction[]
}

// Token 使用告警閾值（每日）
const TOKEN_ALERT_THRESHOLD = 500000

const eventRules: EventRule[] = [
  {
    type: 'task_completed',
    name: '任務完成通知',
    description: '任務完成後自動發送通知到 Telegram 群組',
    enabled: true,
    handler: (payload) => {
      const { task_id, title, assignee, result } = payload.data as {
        task_id?: number
        title?: string
        assignee?: string
        result?: string
      }
      return [{
        action: 'notify',
        target: 'telegram',
        message: `✅ 任務 #${task_id || '?'} 完成\n📋 ${title || '未命名'}\n👤 ${assignee || '未指派'}\n📝 ${result || '無摘要'}`,
        metadata: { task_id, channel: '-5209049869' }
      }]
    }
  },
  {
    type: 'deployment_failed',
    name: '部署失敗自動修復',
    description: '部署失敗時自動建立修復任務卡',
    enabled: true,
    handler: (payload) => {
      const { project, error_message, build_url } = payload.data as {
        project?: string
        error_message?: string
        build_url?: string
      }
      return [
        {
          action: 'alert',
          target: 'telegram',
          message: `🚨 部署失敗: ${project || '未知專案'}\n❌ ${error_message || '未知錯誤'}`,
          metadata: { channel: '-5209049869' }
        },
        {
          action: 'create_task',
          target: 'board_tasks',
          message: `修復部署失敗: ${project}`,
          metadata: {
            title: `🔧 修復部署失敗: ${project}`,
            priority: 'P1',
            assignee: 'blake',
            board: 'agent',
            description: `部署失敗自動建立\n錯誤: ${error_message}\nBuild: ${build_url || 'N/A'}`,
          }
        }
      ]
    }
  },
  {
    type: 'high_token_usage',
    name: 'Token 過高告警',
    description: `今日 Token 消耗超過 ${TOKEN_ALERT_THRESHOLD.toLocaleString()} 時告警`,
    enabled: true,
    threshold: TOKEN_ALERT_THRESHOLD,
    handler: (payload) => {
      const { total_tokens, top_model, top_agent } = payload.data as {
        total_tokens?: number
        top_model?: string
        top_agent?: string
      }
      return [{
        action: 'alert',
        target: 'telegram',
        message: `⚠️ Token 用量告警\n📊 今日消耗: ${(total_tokens || 0).toLocaleString()} tokens\n🤖 最高模型: ${top_model || 'N/A'}\n👤 最高 Agent: ${top_agent || 'N/A'}`,
        metadata: { channel: '1029808355', priority: 'high' }
      }]
    }
  }
]

export function getEventRules(): EventRule[] {
  return eventRules
}

export function processEvent(payload: EventPayload): EventAction[] {
  const rule = eventRules.find(r => r.type === payload.type && r.enabled)
  if (!rule) return []
  return rule.handler(payload)
}

export function getEventRulesSummary() {
  return eventRules.map(r => ({
    type: r.type,
    name: r.name,
    description: r.description,
    enabled: r.enabled,
    threshold: r.threshold,
  }))
}
