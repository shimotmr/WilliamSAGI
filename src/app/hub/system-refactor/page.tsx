export default function SystemRefactorPage() {
  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - 4rem)' }}>
      <iframe
        src="/system-refactor.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="系統架構重整建議書"
      />
    </div>
  )
}
export const metadata = {
  title: '架構重整 · WilliamSAGI',
}
