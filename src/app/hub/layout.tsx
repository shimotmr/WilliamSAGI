import { ThemeProvider } from '@/components/ThemeProvider';

const navLinks = [
  { href: '/hub/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/hub/board',     icon: '◫', label: '任務看板' },
  { href: '/hub/monitor',   icon: '◈', label: '系統監控' },
  { href: '/hub/agents',    icon: '◎', label: 'Agents' },
  { href: '/hub/reports',   icon: '◧', label: '報告' },
  { href: '/hub/analytics', icon: '◉', label: '分析' },
  { href: '/hub/trade',     icon: '◐', label: '交易' },
  { href: '/hub/warroom',   icon: '◑', label: 'War Room' },
];

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultContext="hub" defaultMode="dark">
      <style>{`
        .hub-nav-link {
          display:flex;align-items:center;gap:0.625rem;
          padding:0.5rem 0.75rem;border-radius:0.5rem;
          color:rgba(237,237,239,0.6);text-decoration:none;
          font-size:0.8125rem;font-weight:500;
          transition:all 150ms ease;
        }
        .hub-nav-link:hover {
          background:rgba(94,106,210,0.12);
          color:#EDEDEF;
        }
      `}</style>
      <div style={{ display:'flex',minHeight:'100vh',background:'#050506',color:'#EDEDEF',fontFamily:'Inter,system-ui,sans-serif' }}>
        {/* Sidebar */}
        <aside className="hidden lg:flex" style={{
          width:'220px',flexShrink:0,flexDirection:'column',
          background:'rgba(255,255,255,0.02)',
          borderRight:'1px solid rgba(255,255,255,0.06)',
          padding:'1.5rem 0',
        }}>
          <div style={{ padding:'0 1.25rem 1.5rem',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontWeight:700,fontSize:'1rem',letterSpacing:'-0.02em',color:'#EDEDEF' }}>SAGI</span>
            <span style={{ marginLeft:'0.4rem',fontSize:'0.65rem',color:'#5E6AD2',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase' }}>Hub</span>
          </div>
          <nav style={{ flex:1,padding:'1rem 0.75rem',display:'flex',flexDirection:'column',gap:'0.25rem' }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="hub-nav-link">
                <span style={{ fontSize:'1rem',opacity:0.8 }}>{link.icon}</span>
                {link.label}
              </a>
            ))}
          </nav>
          <div style={{ padding:'1rem 1.25rem',borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'0.5rem' }}>
              <div style={{ width:'7px',height:'7px',borderRadius:'50%',background:'#4ade80',boxShadow:'0 0 6px #4ade80' }} />
              <span style={{ fontSize:'0.75rem',color:'rgba(237,237,239,0.4)' }}>Travis Online</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex:1,display:'flex',flexDirection:'column',minWidth:0 }}>
          <header style={{
            height:'52px',borderBottom:'1px solid rgba(255,255,255,0.06)',
            display:'flex',alignItems:'center',padding:'0 1.5rem',
            background:'rgba(255,255,255,0.01)',backdropFilter:'blur(8px)',
            position:'sticky',top:0,zIndex:40,
          }}>
            <span style={{ fontSize:'0.75rem',color:'rgba(237,237,239,0.35)',letterSpacing:'0.04em' }}>WilliamSAGI</span>
            <div style={{ flex:1 }} />
            <div style={{ width:'7px',height:'7px',borderRadius:'50%',background:'#4ade80',marginRight:'0.5rem' }} />
            <span style={{ fontSize:'0.75rem',color:'rgba(237,237,239,0.4)' }}>Prod</span>
          </header>
          <main style={{ flex:1,padding:'1.5rem',overflowX:'hidden' }}>
            <div style={{ maxWidth:'1280px',margin:'0 auto' }}>
              {children}
            </div>
          </main>
        </div>

        {/* Mobile nav */}
        <nav className="flex lg:hidden" style={{
          position:'fixed',bottom:0,left:0,right:0,zIndex:50,
          background:'#0c0c0e',borderTop:'1px solid rgba(255,255,255,0.06)',
          padding:'0.5rem 0',display:'flex',justifyContent:'space-around',
        }}>
          {navLinks.slice(0,5).map(link => (
            <a key={link.href} href={link.href} style={{
              display:'flex',flexDirection:'column',alignItems:'center',
              gap:'0.125rem',padding:'0.25rem 0.75rem',
              color:'rgba(237,237,239,0.5)',textDecoration:'none',fontSize:'0.625rem',
            }}>
              <span style={{ fontSize:'1.1rem' }}>{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className="block lg:hidden" style={{ height:'64px' }} />
      </div>
    </ThemeProvider>
  );
}
