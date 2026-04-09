'use client'

import { useRef } from 'react'
import { Maximize2, Minimize2, Minus, ScanLine, X } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { WindowState } from '@/features/openclaw-os/types'

export function Window({ windowState, focused, onFocus, onClose, onMinimize, onMaximize, onSnapLeft, onSnapRight, onMove, children }: { windowState: WindowState; focused: boolean; onFocus: () => void; onClose: () => void; onMinimize: () => void; onMaximize: () => void; onSnapLeft: () => void; onSnapRight: () => void; onMove: (patch: Partial<WindowState['frame']>) => void; children: ReactNode }) {
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const resizeRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (windowState.maximized) return
    const target = event.target as HTMLElement
    if (target.closest('button')) return
    dragRef.current = { x: event.clientX, y: event.clientY, left: windowState.frame.x, top: windowState.frame.y }
    onFocus()
    const move = (nextEvent: PointerEvent) => {
      if (!dragRef.current) return
      const deltaX = nextEvent.clientX - dragRef.current.x
      const deltaY = nextEvent.clientY - dragRef.current.y
      const maxX = Math.max(12, window.innerWidth - windowState.frame.width - 12)
      const maxY = Math.max(58, window.innerHeight - windowState.frame.height - 104)
      onMove({
        x: Math.min(maxX, Math.max(12, dragRef.current.left + deltaX)),
        y: Math.min(maxY, Math.max(58, dragRef.current.top + deltaY)),
      })
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (windowState.maximized) return
    event.stopPropagation()
    resizeRef.current = { x: event.clientX, y: event.clientY, width: windowState.frame.width, height: windowState.frame.height }
    const move = (nextEvent: PointerEvent) => {
      if (!resizeRef.current) return
      const width = Math.max(windowState.minWidth || 360, resizeRef.current.width + nextEvent.clientX - resizeRef.current.x)
      const height = Math.max(windowState.minHeight || 280, resizeRef.current.height + nextEvent.clientY - resizeRef.current.y)
      onMove({
        width: Math.min(window.innerWidth - Math.max(24, windowState.frame.x) - 12, width),
        height: Math.min(window.innerHeight - Math.max(70, windowState.frame.y) - 92, height),
      })
    }
    const up = () => {
      resizeRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const frame = windowState.maximized
    ? { left: 16, top: 58, width: 'calc(100vw - 32px)', height: 'calc(100vh - 150px)' }
    : { left: windowState.frame.x, top: windowState.frame.y, width: windowState.frame.width, height: windowState.frame.height }

  return (
    <section
      className={`absolute overflow-hidden rounded-[28px] border backdrop-blur-2xl transition duration-300 ${focused ? 'scale-100 opacity-100' : 'scale-[0.992] opacity-[0.82]'}`}
      style={{
        left: frame.left,
        top: frame.top,
        width: frame.width,
        height: frame.height,
        zIndex: windowState.zIndex,
        borderColor: focused ? `${windowState.tone}66` : 'rgba(255,255,255,0.08)',
        background: focused
          ? 'linear-gradient(180deg, rgba(8,16,24,0.96), rgba(4,10,15,0.88))'
          : 'linear-gradient(180deg, rgba(7,14,21,0.84), rgba(3,8,13,0.74))',
        boxShadow: focused
          ? `0 36px 100px rgba(0,0,0,0.46), 0 0 0 1px ${windowState.tone}18 inset, 0 0 42px ${windowState.tone}18`
          : '0 18px 44px rgba(0,0,0,0.26)',
      }}
      onMouseDown={onFocus}
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
      {!focused ? <div className="pointer-events-none absolute inset-0 bg-slate-950/18" /> : null}
      <div className="relative flex h-14 items-center justify-between border-b border-white/8 px-4" onPointerDown={startDrag}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="h-3 w-3 rounded-full bg-rose-400 transition hover:scale-110" />
          <button onClick={onMinimize} className="h-3 w-3 rounded-full bg-amber-300 transition hover:scale-110" />
          <button onClick={onMaximize} className="h-3 w-3 rounded-full bg-emerald-400 transition hover:scale-110" />
          <div className="ml-3 flex items-center gap-3">
            <div className="rounded-full border border-white/8 bg-white/6 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-white/45">{focused ? 'active' : 'background'}</div>
            <div>
              <div className="text-sm font-medium text-white">{windowState.title}</div>
              <div className="text-[11px] text-white/38">Windowed operator surface</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/40">
          <button onClick={onSnapLeft} className="rounded-lg p-1.5 transition hover:bg-white/8 hover:text-white/80"><Minimize2 className="h-4 w-4 rotate-45" /></button>
          <button onClick={onSnapRight} className="rounded-lg p-1.5 transition hover:bg-white/8 hover:text-white/80"><Minimize2 className="h-4 w-4 -rotate-45" /></button>
          <button onClick={onMinimize} className="rounded-lg p-1.5 transition hover:bg-white/8 hover:text-white/80"><Minus className="h-4 w-4" /></button>
          <button onClick={onMaximize} className="rounded-lg p-1.5 transition hover:bg-white/8 hover:text-white/80"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={onClose} className="rounded-lg p-1.5 transition hover:bg-white/8 hover:text-white/80"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="relative h-[calc(100%-56px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_22%)] p-4">{children}</div>
      {!windowState.maximized ? (
        <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/8 bg-white/6 text-white/40" onPointerDown={startResize}>
          <ScanLine className="h-3.5 w-3.5 rotate-45" />
        </div>
      ) : null}
    </section>
  )
}
