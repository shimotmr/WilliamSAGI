'use client'

export function DesktopContextMenu({ state, onClose, onOpenAll, onMissionControl }: { state: { open: boolean; x: number; y: number }; onClose: () => void; onOpenAll: () => void; onMissionControl: () => void }) {
  if (!state.open) return null
  return (
    <div className="fixed z-[150]" style={{ left: state.x, top: state.y }}>
      <div className="w-52 rounded-[22px] border border-white/10 bg-black/65 p-2 shadow-2xl backdrop-blur-2xl">
        <button onClick={onOpenAll} className="w-full rounded-2xl px-3 py-2 text-left text-sm text-white/78 transition hover:bg-white/8">打開所有 Apps</button>
        <button onClick={onMissionControl} className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-white/78 transition hover:bg-white/8">Mission Control</button>
        <button onClick={onClose} className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-white/52 transition hover:bg-white/8">取消</button>
      </div>
    </div>
  )
}
