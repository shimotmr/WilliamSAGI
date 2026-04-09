'use client'

import { useMemo, useState } from 'react'
import { Desktop } from '@/features/openclaw-os/components/Desktop'
import { Dock } from '@/features/openclaw-os/components/Dock'
import { MenuBar } from '@/features/openclaw-os/components/MenuBar'
import { MobileDashboard } from '@/features/openclaw-os/components/MobileDashboard'
import { WindowManager } from '@/features/openclaw-os/components/WindowManager'
import { useWindowManager } from '@/features/openclaw-os/hooks/useWindowManager'
import type { OsAppId, WebOsData } from '@/features/openclaw-os/types'
import { openClawOsTones } from '@/features/openclaw-os/types'

const mockData: WebOsData = {
  summary: {
    activeNow: 8,
    pendingNow: 13,
    completedToday: 17,
    totalTasks: 64,
    anomalousEvents24h: 3,
    reportsReady: 5,
  },
  lanes: {
    running: [
      { id: 4223, title: 'Refine desktop layering and focus states', status: '執行中', priority: 'P1', assignee: 'Blake', progress: 78 },
      { id: 4224, title: 'Compress mobile dashboard spacing', status: '執行中', priority: 'P1', assignee: 'Blake', progress: 64 },
      { id: 4219, title: 'Validate dock motion against real usage', status: '已派發', priority: 'P2', assignee: 'Rex', progress: 40 },
    ],
    pending: [
      { id: 4201, title: 'Tighten empty-state storytelling', status: '待執行', priority: 'P2', assignee: 'Oscar' },
    ],
    finished: [
      { id: 4190, title: 'Extract window manager hooks', status: '已完成', priority: 'P2', assignee: 'Blake' },
    ],
  },
  agents: [
    { name: 'Blake', total: 9, running: 4, pending: 3, completed: 2, color: '#4ade80' },
    { name: 'Rex', total: 7, running: 2, pending: 2, completed: 3, color: '#f59e0b' },
    { name: 'Oscar', total: 5, running: 1, pending: 2, completed: 2, color: '#60a5fa' },
  ],
  sessions: [
    { id: 4223, title: 'desktop refinement', status: '執行中', assignee: 'Blake', sessionId: 'agent:blake:desktop', dispatchRuntime: 'codex', updatedAt: new Date().toISOString(), relative: '剛剛' },
  ],
  telegram: {
    guardHealthy: true,
    findings: [],
    blockedProviders: [],
    lastGuardMinutes: 4,
    gatewayLastMinutes: 2,
    sessionKey: 'telegram:mock',
    sessionId: 'mock-session',
    messageLastMinutes: 3,
    quickCommands: ['任務', '行程', '搜尋'],
    messages: [
      { id: 'm1', kind: 'inbound', timestamp: new Date().toISOString(), relative: '2 分鐘前', senderLabel: 'William', body: '先把 desktop layering、dock 跟 mobile density 收斂一下。' },
      { id: 'm2', kind: 'outbound', timestamp: new Date().toISOString(), relative: '1 分鐘前', senderLabel: 'Blake', body: '收到，先本地驗收，不碰 production。' },
    ],
    messageStats: { inbound: 6, outbound: 4, replyContext: 2, commands: { task: 3 } },
    ledger: [
      { kind: 'guard', label: 'Telegram Session Guard', detail: 'No conflict', relative: '4 分鐘前', tone: 'positive' },
    ],
  },
  watchtower: {
    dispatchSuppressed: 1,
    startBlocked: 0,
    harnessFailed: 1,
    leaseHandoffs: 2,
    completedSignals: 11,
  },
  eventFeed: [
    { id: 1, taskId: 4223, title: 'Desktop convergence', eventType: 'completed', createdAt: new Date().toISOString(), tone: 'positive', relative: '剛剛', summary: 'Focus layering improved' },
    { id: 2, taskId: 4224, title: 'Mobile spacing', eventType: 'dispatch_suppressed', createdAt: new Date().toISOString(), tone: 'warning', relative: '12 分鐘前', summary: 'Card rhythm too loose' },
  ],
  reports: [
    { id: 1, title: 'WebOS iteration checkpoint', author: 'Blake', type: 'design-note', created_at: new Date().toISOString(), relative: '5 分鐘前' },
    { id: 2, title: 'Mobile density comparison', author: 'Blake', type: 'review', created_at: new Date().toISOString(), relative: '18 分鐘前' },
  ],
}

function MockApp({ title }: { title: string }) {
  return (
    <div className="h-full rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 text-white/72">
      <div className="text-[10px] uppercase tracking-[0.26em] text-white/35">{title}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{title} surface</div>
      <div className="mt-2 max-w-xl text-sm leading-6">Review harness only. 用這裡檢查視窗層級、背景干擾、dock 與 menubar 協調，不依賴正式資料源。</div>
    </div>
  )
}

function DesktopHarness() {
  const wm = useWindowManager()
  const [clock] = useState('10:28')
  const apps = [
    { id: 'tasks' as const, title: 'Tasks', tone: openClawOsTones.blue },
    { id: 'telegram' as const, title: 'Telegram', tone: openClawOsTones.green },
    { id: 'reports' as const, title: 'Reports', tone: openClawOsTones.amber },
    { id: 'events' as const, title: 'Events', tone: openClawOsTones.accent },
    { id: 'sessions' as const, title: 'Sessions', tone: '#c084fc' },
    { id: 'agents' as const, title: 'Agents', tone: '#fb923c' },
    { id: 'health' as const, title: 'Health', tone: openClawOsTones.red },
  ]

  const renderApp = (id: OsAppId) => <MockApp title={apps.find((app) => app.id === id)?.title || id} />
  const activeTitle = apps.find((app) => app.id === wm.focusedId)?.title || 'Desktop'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07131b] text-white">
      <style>{`@keyframes dock-bounce {0%,100%{transform:translateY(0)}35%{transform:translateY(-10px)}65%{transform:translateY(0)}}`}</style>
      <MenuBar activeTitle={activeTitle} clock={clock} onMissionControl={() => {}} onNotifications={() => {}} />
      <div className="h-screen px-4 pb-28 pt-20">
        <Desktop data={mockData} onOpenApp={wm.openWindow} onContextMenu={() => {}} />
        <WindowManager windows={wm.visibleWindows} focusedId={wm.focusedId} renderApp={renderApp} onFocus={wm.bringToFront} onClose={wm.closeWindow} onMinimize={wm.minimizeWindow} onMaximize={wm.maximizeWindow} onSnapLeft={(id) => wm.snapWindow(id, 'left')} onSnapRight={(id) => wm.snapWindow(id, 'right')} onMove={wm.updateFrame} />
      </div>
      <Dock items={apps} activeIds={wm.openIds} minimizedIds={wm.minimizedIds} onOpen={wm.openWindow} />
    </div>
  )
}

export default function ReviewPage() {
  const mode = useMemo(() => {
    if (typeof window === 'undefined') return 'split'
    return new URLSearchParams(window.location.search).get('mode') || 'split'
  }, [])

  if (mode === 'desktop') {
    return <DesktopHarness />
  }

  if (mode === 'mobile') {
    return <MobileDashboard data={mockData} refreshing={false} onRefresh={() => {}} />
  }

  return (
    <div className="grid min-h-screen gap-8 bg-black p-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[#07131b]">
        <DesktopHarness />
      </div>
      <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[#07131b]">
        <MobileDashboard data={mockData} refreshing={false} onRefresh={() => {}} />
      </div>
    </div>
  )
}
