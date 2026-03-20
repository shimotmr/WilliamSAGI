export default function V44Page() {
  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - 4rem)' }}>
      <iframe
        src="/v4-4-architecture.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="V4.4 智能任務 Pipeline"
      />
    </div>
  )
}

export const metadata = {
  title: 'V4.4 架構 · WilliamSAGI',
  description: 'V4.4 智能任務 Pipeline — Two-Stage Review + TDD + Systematic Debugging',
}
