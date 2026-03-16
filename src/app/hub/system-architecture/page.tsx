export default function SystemArchitecturePage() {
  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - 4rem)' }}>
      <iframe
        src="/system-architecture.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="系統腳本流程圖"
      />
    </div>
  )
}

export const metadata = {
  title: '腳本流程圖 · WilliamSAGI',
  description: '169 個腳本 × 13 工作流 × V4 缺口分析',
}
