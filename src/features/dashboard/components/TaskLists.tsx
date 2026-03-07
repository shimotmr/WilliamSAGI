'use client'

import Card from '@/components/ui/Card'
import type { DashboardTask } from '../types'

interface Props {
  runningTasks: DashboardTask[]
  recentCompleted: DashboardTask[]
}

function TaskBlock({
  title,
  tasks,
  emptyText,
}: {
  title: string
  tasks: DashboardTask[]
  emptyText: string
}) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-[var(--foreground)]">
          {title}
        </div>
        <div className="text-xs text-[var(--foreground-muted)]">
          {tasks.length || 0}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-6 text-center text-sm text-[var(--foreground-muted)]">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={`${task.title}-${index}`}
              className="border-b pb-3 last:border-b-0 last:pb-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="truncate text-sm font-medium text-[var(--foreground)]">
                {task.title}
              </div>
              <div className="mt-1 text-xs text-[var(--foreground-muted)]">
                {task.assignee}
                {task.completedAt
                  ? ` · ${new Date(task.completedAt).toLocaleDateString('zh-TW', {
                      month: 'numeric',
                      day: 'numeric',
                    })}`
                  : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function TaskLists({ runningTasks, recentCompleted }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <TaskBlock title="執行中" tasks={runningTasks} emptyText="目前無執行中任務" />
      <TaskBlock title="最近完成" tasks={recentCompleted} emptyText="尚無完成紀錄" />
    </div>
  )
}
