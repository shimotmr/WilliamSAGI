'use client'

import { useState } from 'react'

type TaskResult = {
  task?: {
    id: number
    title?: string
    status?: string
    assignee?: string
    priority?: string
    session_id?: string | null
  }
  summary?: string[]
  reports?: unknown[]
  artifacts?: string[]
  artifact_previews?: unknown[]
  session?: unknown
  events?: unknown[]
  agent_jobs?: unknown[]
  heartbeat_snapshot?: unknown
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-neutral-200">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export default function TaskDebugAdmin() {
  const [taskId, setTaskId] = useState('4001')
  const [reportId, setReportId] = useState('1353')
  const [artifactPath, setArtifactPath] = useState('/Users/travis/clawd/docs/harness/README.md')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null)
  const [reportResult, setReportResult] = useState<unknown>(null)
  const [artifactResult, setArtifactResult] = useState<unknown>(null)

  async function runAction(action: 'task' | 'report' | 'artifact') {
    setLoading(action)
    setError(null)

    try {
      const body =
        action === 'task'
          ? { action, taskId: Number(taskId), includeReportContent: true }
          : action === 'report'
            ? { action, reportId: Number(reportId) }
            : { action, artifactPath }

      const data = await parseResponse(
        await fetch('/api/hub/task-debug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      )

      if (action === 'task') {
        setTaskResult(data.result || null)
      } else if (action === 'report') {
        setReportResult(data.result || null)
      } else {
        setArtifactResult(data.result || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task Debug 執行失敗')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8 text-neutral-100">
      <section className="rounded-[28px] border border-white/10 bg-black/20 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">Task Debug</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              直接在 SAGI 讀取 OpenClaw 的 task debug surface。這頁優先服務日常排障，不做第二套控制面。
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
            CLI 對應：<code className="font-mono">task_debug_surface.py</code>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm font-medium text-neutral-100">Task 視角</div>
          <div className="mt-1 text-xs text-neutral-500">task + events + reports + session + heartbeat</div>
          <input
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-400/40"
            placeholder="4001"
          />
          <button
            type="button"
            onClick={() => runAction('task')}
            disabled={loading !== null}
            className="mt-4 w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === 'task' ? '讀取中…' : '讀取 Task Surface'}
          </button>
        </article>

        <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm font-medium text-neutral-100">Report 視角</div>
          <div className="mt-1 text-xs text-neutral-500">直接讀單一 report 預覽</div>
          <input
            value={reportId}
            onChange={(event) => setReportId(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-400/40"
            placeholder="1353"
          />
          <button
            type="button"
            onClick={() => runAction('report')}
            disabled={loading !== null}
            className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === 'report' ? '讀取中…' : '開啟 Report'}
          </button>
        </article>

        <article className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm font-medium text-neutral-100">Artifact 視角</div>
          <div className="mt-1 text-xs text-neutral-500">直接讀單一路徑 artifact / 文件</div>
          <textarea
            value={artifactPath}
            onChange={(event) => setArtifactPath(event.target.value)}
            className="mt-4 min-h-[108px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-indigo-400/40"
          />
          <button
            type="button"
            onClick={() => runAction('artifact')}
            disabled={loading !== null}
            className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === 'artifact' ? '讀取中…' : '開啟 Artifact'}
          </button>
        </article>
      </section>

      {error ? (
        <section className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      {taskResult ? (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Task #{taskResult.task?.id} {taskResult.task?.title || ''}
            </h2>
            {taskResult.task?.status ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                {taskResult.task.status}
              </span>
            ) : null}
          </div>
          {Array.isArray(taskResult.summary) && taskResult.summary.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-neutral-200">
              {taskResult.summary.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-medium text-neutral-300">Reports</div>
              <JsonBlock value={taskResult.reports || []} />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-neutral-300">Artifact Previews</div>
              <JsonBlock value={taskResult.artifact_previews || []} />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-neutral-300">Session</div>
              <JsonBlock value={taskResult.session || {}} />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-neutral-300">Heartbeat</div>
              <JsonBlock value={taskResult.heartbeat_snapshot || {}} />
            </div>
            <div className="xl:col-span-2">
              <div className="mb-2 text-sm font-medium text-neutral-300">Events</div>
              <JsonBlock value={taskResult.events || []} />
            </div>
          </div>
        </section>
      ) : null}

      {reportResult ? (
        <section className="rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="mb-3 text-xl font-semibold tracking-[-0.02em]">Report 輸出</div>
          <JsonBlock value={reportResult} />
        </section>
      ) : null}

      {artifactResult ? (
        <section className="rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="mb-3 text-xl font-semibold tracking-[-0.02em]">Artifact 輸出</div>
          <JsonBlock value={artifactResult} />
        </section>
      ) : null}
    </div>
  )
}
