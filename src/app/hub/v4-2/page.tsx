export default function V42Page() {
  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - 4rem)' }}>
      <iframe
        src="/v4-2-architecture.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="V4.2 智能任務 Pipeline"
      />
    </div>
  )
}

export const metadata = {
  title: 'V4.2 架構 · WilliamSAGI',
  description: 'V4.2 智能任務 Pipeline — 8 個新模組',
}
