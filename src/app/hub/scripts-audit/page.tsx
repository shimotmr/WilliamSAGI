export default function ScriptsAuditPage() {
  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - 4rem)' }}>
      <iframe
        src="/scripts-audit.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="腳本審計儀表板"
      />
    </div>
  )
}

export const metadata = {
  title: '腳本審計 · WilliamSAGI',
}
