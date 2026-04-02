'use client'

import Link from 'next/link'
import { useState } from 'react'

type Props = {
  mode: 'hit' | 'recommendation'
  label?: string
  title?: string
  url?: string
  source?: string
  query?: string
  reason?: string
  trackingGroup?: string
  linkedDomain?: string
}

export default function TagIntelTaskButtons(props: Props) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [taskId, setTaskId] = useState<number | null>(null)

  async function createTask() {
    setBusy(true)
    setMessage(null)
    setIsError(false)
    setTaskId(null)
    try {
      const response = await fetch('/api/hub/tag-intel-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || '建卡失敗')
      }
      if (payload.duplicate) {
        setTaskId(payload.taskId ?? null)
        setMessage(`已存在任務 #${payload.taskId}`)
        return
      }
      setTaskId(payload.taskId ?? null)
      setMessage(`已建立 #${payload.taskId}`)
    } catch (error) {
      setIsError(true)
      setMessage(error instanceof Error ? error.message : '建卡失敗')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void createTask()}
        disabled={busy}
        className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-100 transition hover:border-amber-300/40 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? '建卡中…' : props.mode === 'recommendation' ? '一鍵建研究卡' : '一鍵建追查卡'}
      </button>
      {message ? (
        <span className={`text-[11px] ${isError ? 'text-rose-300' : 'text-emerald-300'}`}>{message}</span>
      ) : null}
      {taskId ? (
        <Link
          href={`/hub/v4/task/${taskId}`}
          className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
        >
          開任務 #{taskId}
        </Link>
      ) : null}
    </div>
  )
}
