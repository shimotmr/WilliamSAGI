export default function ShowcasePage() {
  const features = [
    { icon: "◈", title: "Multi-Agent OS", desc: "6 specialized agents — Travis, Blake, Rex, Oscar, Warren, Griffin — each with a dedicated role and model." },
    { icon: "◉", title: "Autonomous Pipeline", desc: "Self-healing job orchestration with retry engine, failure classifier, and weekly process review." },
    { icon: "◐", title: "Secure Audit System", desc: "3-layer audit gate prevents deployment bypasses. Pre-execution watermark verification." },
    { icon: "◑", title: "Heartbeat Automation", desc: "5-minute heartbeat loop dispatches tasks, monitors stuck jobs, and maintains system health." },
    { icon: "⊞", title: "William Hub", desc: "Real-time dashboard for reports, analytics, agent status, and model usage across all providers." },
    { icon: "◫", title: "RAG Memory", desc: "7,331 vectors across 12 collections. Semantic search over memory, tasks, cases, and knowledge." },
  ];

  return (
    <div style={{ color: '#EDEDEF', maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.375rem 0.875rem', border: '1px solid rgba(94,106,210,0.4)',
          borderRadius: '9999px', marginBottom: '1.5rem',
          fontSize: '0.75rem', color: '#5E6AD2', letterSpacing: '0.08em',
          background: 'rgba(94,106,210,0.08)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          SAGI v2.0 — Production
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #EDEDEF 0%, rgba(237,237,239,0.6) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          William&apos;s Super<br />AGI Operating System
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#8A8F98', maxWidth: '600px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          Autonomous AI agent system managing tasks, research, trading, and code — 24/7 with zero human intervention.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/hub/dashboard" style={{
            padding: '0.75rem 1.75rem', borderRadius: '0.625rem',
            background: '#5E6AD2', color: '#fff', fontWeight: 600, fontSize: '0.9rem',
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}>Open Hub →</a>
          <a href="/portal/dashboard" style={{
            padding: '0.75rem 1.75rem', borderRadius: '0.625rem',
            border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(237,237,239,0.8)',
            fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none',
          }}>Portal</a>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px', padding: '1.5rem',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(94,106,210,0.15)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.1rem', marginBottom: '1rem',
              border: '1px solid rgba(94,106,210,0.25)',
            }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.5rem', color: '#EDEDEF' }}>{f.title}</div>
            <div style={{ fontSize: '0.8125rem', color: '#8A8F98', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div style={{
        marginTop: '4rem', padding: '2rem',
        background: 'rgba(94,106,210,0.06)', border: '1px solid rgba(94,106,210,0.15)',
        borderRadius: '20px', display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', textAlign: 'center',
      }}>
        {[
          { v: '800+', l: '已完成任務' },
          { v: '6',    l: 'Active Agents' },
          { v: '7,331', l: 'Memory Vectors' },
          { v: '5m',   l: 'Heartbeat' },
          { v: '24/7', l: '全時運行' },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#5E6AD2', letterSpacing: '-0.03em' }}>{s.v}</div>
            <div style={{ fontSize: '0.75rem', color: '#8A8F98', marginTop: '0.25rem' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
