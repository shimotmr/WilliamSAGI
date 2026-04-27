'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AgentsApp } from '@/features/openclaw-os/apps/AgentsApp'
import { EventsApp } from '@/features/openclaw-os/apps/EventsApp'
import { HealthApp } from '@/features/openclaw-os/apps/HealthApp'
import { ReportsApp } from '@/features/openclaw-os/apps/ReportsApp'
import { SessionsApp } from '@/features/openclaw-os/apps/SessionsApp'
import { TasksApp } from '@/features/openclaw-os/apps/TasksApp'
import { TelegramApp } from '@/features/openclaw-os/apps/TelegramApp'
import { Desktop } from '@/features/openclaw-os/components/Desktop'
import { DesktopContextMenu } from '@/features/openclaw-os/components/DesktopContextMenu'
import { Dock } from '@/features/openclaw-os/components/Dock'
import { MenuBar } from '@/features/openclaw-os/components/MenuBar'
import { MissionControl } from '@/features/openclaw-os/components/MissionControl'
import { MobileDashboard } from '@/features/openclaw-os/components/MobileDashboard'
import { NotificationPanel } from '@/features/openclaw-os/components/NotificationPanel'
import { WindowManager } from '@/features/openclaw-os/components/WindowManager'
import { useWindowManager } from '@/features/openclaw-os/hooks/useWindowManager'
import type { OsAppId, WebOsData } from '@/features/openclaw-os/types'
import { openClawOsTones } from '@/features/openclaw-os/types'

const emptyData: WebOsData = {
  summary: { activeNow: 0, pendingNow: 0, completedToday: 0, totalTasks: 0, anomalousEvents24h: 0, reportsReady: 0 },
  lanes: { running: [], pending: [], finished: [] },
  agents: [],
  sessions: [],
  telegram: { guardHealthy: false, findings: [], blockedProviders: [], lastGuardMinutes: null, gatewayLastMinutes: null, quickCommands: [], messages: [], messageStats: { inbound: 0, outbound: 0, replyContext: 0, commands: {} }, ledger: [] },
  watchtower: { dispatchSuppressed: 0, startBlocked: 0, harnessFailed: 0, leaseHandoffs: 0, completedSignals: 0 },
  eventFeed: [],
  reports: [],
}

function OpenClawOSPage() {
  const [data, setData] = useState<WebOsData | null>(null)
  const [clock, setClock] = useState('')
  const [error, setError] = useState('')
  const [desktopMenu, setDesktopMenu] = useState({ open: false, x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const wm = useWindowManager()

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/hub/openclaw-os', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || '載入失敗')
      setData(json)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const refresh = setInterval(load, 60000)
    const tick = () => setClock(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const timer = setInterval(tick, 60000)
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F3') wm.setMissionControl((value) => !value)
      if (event.key === 'Escape') {
        wm.setMissionControl(false)
        wm.setNotificationCenter(false)
        setDesktopMenu((prev) => ({ ...prev, open: false }))
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', check)
    return () => {
      clearInterval(refresh)
      clearInterval(timer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', check)
    }
  }, [load, wm])

  const apps = useMemo(() => ([
    { id: 'tasks' as const, title: 'Tasks', tone: openClawOsTones.blue },
    { id: 'telegram' as const, title: 'Telegram', tone: openClawOsTones.green },
    { id: 'reports' as const, title: 'Reports', tone: openClawOsTones.amber },
    { id: 'events' as const, title: 'Events', tone: openClawOsTones.accent },
    { id: 'sessions' as const, title: 'Sessions', tone: '#c084fc' },
    { id: 'agents' as const, title: 'Agents', tone: '#fb923c' },
    { id: 'health' as const, title: 'Health', tone: openClawOsTones.red },
  ]), [])

  const renderApp = (id: OsAppId) => {
    if (!data) return <div className="text-sm text-white/55">Loading…</div>
    switch (id) {
      case 'tasks': return <TasksApp data={data} />
      case 'telegram': return <TelegramApp data={data} />
      case 'reports': return <ReportsApp data={data} />
      case 'events': return <EventsApp data={data} />
      case 'sessions': return <SessionsApp data={data} />
      case 'agents': return <AgentsApp data={data} />
      case 'health': return <HealthApp data={data} />
    }
  }

  const activeTitle = apps.find((app) => app.id === wm.focusedId)?.title || 'Desktop'

  if (isMobile) {
    return <MobileDashboard data={data ?? emptyData} refreshing={refreshing} onRefresh={load} />
  }

  return (
    <main className="min-h-screen overflow-hidden text-white" style={{ background: openClawOsTones.bg, ['--muted' as string]: openClawOsTones.muted }}>
      <style>{`@keyframes dock-bounce {0%,100%{transform:translateY(0)}35%{transform:translateY(-10px)}65%{transform:translateY(0)}}`}</style>
      <MenuBar activeTitle={activeTitle} clock={clock} onMissionControl={() => wm.setMissionControl(!wm.missionControl)} onNotifications={() => wm.setNotificationCenter(!wm.notificationCenter)} />
      <div className="h-screen px-4 pb-28 pt-16">
        {error ? <div className="mb-3 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-50">{error}</div> : null}
        {data ? <Desktop data={data} onOpenApp={wm.openWindow} onContextMenu={(x, y) => setDesktopMenu({ open: true, x, y })} /> : <div className="grid h-full place-items-center text-white/55">載入 OpenClaw OS…</div>}
        <WindowManager windows={wm.visibleWindows} focusedId={wm.focusedId} renderApp={renderApp} onFocus={wm.bringToFront} onClose={wm.closeWindow} onMinimize={wm.minimizeWindow} onMaximize={wm.maximizeWindow} onSnapLeft={(id) => wm.snapWindow(id, 'left')} onSnapRight={(id) => wm.snapWindow(id, 'right')} onMove={wm.updateFrame} />
      </div>
      <Dock items={apps} activeIds={wm.openIds} minimizedIds={wm.minimizedIds} onOpen={wm.openWindow} />
      <DesktopContextMenu state={desktopMenu} onClose={() => setDesktopMenu((prev) => ({ ...prev, open: false }))} onOpenAll={() => { apps.forEach((app) => wm.openWindow(app.id)); setDesktopMenu((prev) => ({ ...prev, open: false })) }} onMissionControl={() => { wm.setMissionControl(true); setDesktopMenu((prev) => ({ ...prev, open: false })) }} />
      {data ? <NotificationPanel open={wm.notificationCenter} data={data} onClose={() => wm.setNotificationCenter(false)} onOpenApp={(id) => { wm.openWindow(id); wm.setNotificationCenter(false) }} /> : null}
      <MissionControl open={wm.missionControl} windows={wm.visibleWindows} onClose={() => wm.setMissionControl(false)} onSelect={(id) => { wm.openWindow(id); wm.setMissionControl(false) }} />
    </main>
  )
}

export default dynamic(() => Promise.resolve(OpenClawOSPage), { ssr: false })
