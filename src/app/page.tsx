export default function Home() {
  return (
    <main style={{padding:'2rem', fontFamily:'sans-serif'}}>
      <h1>🤖 WilliamSAGI</h1>
      <p>William Super AGI Hub</p>
      <div style={{display:'flex',gap:'1rem',marginTop:'2rem'}}>
        <a href="/hub" style={{padding:'1rem',border:'1px solid #ccc',borderRadius:'8px',textDecoration:'none'}}>
          <h2>🧠 AI Hub</h2>
          <p>Reports / AI 儀表板</p>
        </a>
        <a href="/daily" style={{padding:'1rem',border:'1px solid #ccc',borderRadius:'8px',textDecoration:'none'}}>
          <h2>📝 Travis Daily</h2>
          <p>個人專欄</p>
        </a>
        <a href="/portal" style={{padding:'1rem',border:'1px solid #ccc',borderRadius:'8px',textDecoration:'none'}}>
          <h2>🏢 Sales Portal</h2>
          <p>和椿通路業務系統</p>
        </a>
      </div>
    </main>
  )
}
