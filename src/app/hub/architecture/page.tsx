export default function ArchitecturePage() {
  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - 4rem)' }}>
      <iframe
        src="/v4-architecture.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="V4 系統架構圖"
      />
    </div>
  )
}

export const metadata = {
  title: 'V4 架構 · WilliamSAGI',
  description: 'V4 自主系統架構圖 — 12 週升級計畫',
}
