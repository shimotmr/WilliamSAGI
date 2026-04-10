'use client'

import { useCallback, useMemo, useState } from 'react'
import type { OsAppId, WindowFrame, WindowState } from '@/features/openclaw-os/types'
import { openClawOsTones } from '@/features/openclaw-os/types'

const frames: Record<OsAppId, WindowFrame> = {
  tasks: { x: 56, y: 116, width: 600, height: 650 },
  telegram: { x: 408, y: 132, width: 500, height: 612 },
  reports: { x: 844, y: 152, width: 464, height: 540 },
  events: { x: 152, y: 164, width: 600, height: 520 },
  sessions: { x: 802, y: 180, width: 448, height: 462 },
  agents: { x: 284, y: 148, width: 470, height: 434 },
  health: { x: 650, y: 122, width: 470, height: 490 },
}

const meta: Record<OsAppId, Omit<WindowState, 'frame' | 'zIndex'>> = {
  tasks: { id: 'tasks', title: 'Tasks', tone: openClawOsTones.blue, iconKey: 'check-square' },
  telegram: { id: 'telegram', title: 'Telegram', tone: openClawOsTones.green, iconKey: 'message-square' },
  reports: { id: 'reports', title: 'Reports', tone: openClawOsTones.amber, iconKey: 'file-text' },
  events: { id: 'events', title: 'Events', tone: openClawOsTones.accent, iconKey: 'activity' },
  sessions: { id: 'sessions', title: 'Sessions', tone: '#c084fc', iconKey: 'workflow' },
  agents: { id: 'agents', title: 'Agents', tone: '#fb923c', iconKey: 'bot' },
  health: { id: 'health', title: 'Health', tone: openClawOsTones.red, iconKey: 'heart-pulse' },
}

const initialOrder: OsAppId[] = ['tasks', 'telegram']

function makeWindow(id: OsAppId, zIndex: number): WindowState {
  return {
    ...meta[id],
    frame: frames[id],
    zIndex,
    minimized: false,
    maximized: false,
    minWidth: 360,
    minHeight: 280,
  }
}

export function useWindowManager() {
  const [windows, setWindows] = useState<Record<OsAppId, WindowState>>(() => ({
    tasks: makeWindow('tasks', 10),
    telegram: makeWindow('telegram', 11),
    reports: makeWindow('reports', 12),
    events: makeWindow('events', 13),
    sessions: makeWindow('sessions', 14),
    agents: makeWindow('agents', 15),
    health: makeWindow('health', 16),
  }))
  const [openIds, setOpenIds] = useState<OsAppId[]>(initialOrder)
  const [focusedId, setFocusedId] = useState<OsAppId>('telegram')
  const [zCounter, setZCounter] = useState(20)
  const [missionControl, setMissionControl] = useState(false)
  const [notificationCenter, setNotificationCenter] = useState(false)

  const bringToFront = useCallback((id: OsAppId) => {
    setZCounter((current) => {
      const next = current + 1
      setWindows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          minimized: false,
          zIndex: next,
        },
      }))
      return next
    })
    setFocusedId(id)
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const openWindow = useCallback((id: OsAppId) => {
    bringToFront(id)
  }, [bringToFront])

  const closeWindow = useCallback((id: OsAppId) => {
    setOpenIds((prev) => {
      const next = prev.filter((item) => item !== id)
      setFocusedId(next[next.length - 1] || (null as unknown as OsAppId))
      return next
    })
  }, [])

  const minimizeWindow = useCallback((id: OsAppId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        minimized: true,
      },
    }))
    setFocusedId((prev) => (prev === id ? null : prev) as OsAppId)
  }, [])

  const maximizeWindow = useCallback((id: OsAppId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        maximized: !prev[id].maximized,
      },
    }))
    bringToFront(id)
  }, [bringToFront])

  const snapWindow = useCallback((id: OsAppId, side: 'left' | 'right') => {
    if (typeof window === 'undefined') return
    const margin = 16
    const gutter = 12
    const width = Math.floor((window.innerWidth - margin * 2 - gutter) / 2)
    const height = window.innerHeight - 162
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        minimized: false,
        maximized: false,
        frame: {
          x: side === 'left' ? margin : margin + width + gutter,
          y: 74,
          width,
          height,
        },
      },
    }))
    bringToFront(id)
  }, [bringToFront])

  const updateFrame = useCallback((id: OsAppId, frame: Partial<WindowFrame>) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        frame: {
          ...prev[id].frame,
          ...frame,
        },
      },
    }))
  }, [])

  const visibleWindows = useMemo(
    () => openIds.map((id) => windows[id]).filter((window) => !window.minimized).sort((a, b) => a.zIndex - b.zIndex),
    [openIds, windows],
  )

  const minimizedIds = useMemo(
    () => openIds.filter((id) => windows[id].minimized),
    [openIds, windows],
  )

  return {
    windows,
    visibleWindows,
    openIds,
    minimizedIds,
    focusedId,
    missionControl,
    notificationCenter,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    snapWindow,
    updateFrame,
    bringToFront,
    setMissionControl,
    setNotificationCenter,
  }
}
