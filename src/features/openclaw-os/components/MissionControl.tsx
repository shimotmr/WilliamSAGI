'use client'

import type { WindowState } from '@/features/openclaw-os/types'

export function MissionControl({ open, windows, onClose, onSelect }: { open: boolean; windows: WindowState[]; onClose: () => void; onSelect: (id: WindowState['id']) => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[140] bg-[rgba(2,6,10,0.72)] px-6 py-20 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.32em] text-white/35">Mission Control</div>
          <div className="mt-2 text-3xl font-semibold text-white">所有視窗，一次管理</div>
          <div className="mt-2 text-sm text-white/52">縮圖只是導覽，不再跟桌面背景搶畫面。</div>
        </div>
        <button onClick={onClose} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/72">關閉</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {windows.map((windowState) => (
          <button key={windowState.id} onClick={() => onSelect(windowState.id)} className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-left transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/35">{windowState.title}</div>
                <div className="mt-1 text-sm text-white/52">z-index {windowState.zIndex}</div>
              </div>
              <div className="rounded-full border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/48">preview</div>
            </div>
            <div className="mt-4 h-48 rounded-[22px] border border-white/8 p-3" style={{ background: `radial-gradient(circle at 18% 18%, ${windowState.tone}26, transparent 42%), linear-gradient(180deg, rgba(10,18,26,0.96), rgba(5,10,14,0.82))` }}>
              <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Window frame</div>
              <div className="mt-3 h-[calc(100%-52px)] rounded-[18px] border border-dashed border-white/10 bg-white/[0.03]" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
