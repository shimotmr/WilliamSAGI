'use client'

import type { ReactNode } from 'react'
import type { OsAppId, WindowState } from '@/features/openclaw-os/types'
import { Window } from '@/features/openclaw-os/components/Window'

export function WindowManager({ windows, focusedId, renderApp, onFocus, onClose, onMinimize, onMaximize, onSnapLeft, onSnapRight, onMove }: { windows: WindowState[]; focusedId: OsAppId | null; renderApp: (id: OsAppId) => ReactNode; onFocus: (id: OsAppId) => void; onClose: (id: OsAppId) => void; onMinimize: (id: OsAppId) => void; onMaximize: (id: OsAppId) => void; onSnapLeft: (id: OsAppId) => void; onSnapRight: (id: OsAppId) => void; onMove: (id: OsAppId, patch: Partial<WindowState['frame']>) => void }) {
  return (
    <>
      {windows.map((windowState) => (
        <Window
          key={windowState.id}
          windowState={windowState}
          focused={focusedId === windowState.id}
          onFocus={() => onFocus(windowState.id)}
          onClose={() => onClose(windowState.id)}
          onMinimize={() => onMinimize(windowState.id)}
          onMaximize={() => onMaximize(windowState.id)}
          onSnapLeft={() => onSnapLeft(windowState.id)}
          onSnapRight={() => onSnapRight(windowState.id)}
          onMove={(patch) => onMove(windowState.id, patch)}
        >
          {renderApp(windowState.id)}
        </Window>
      ))}
    </>
  )
}
