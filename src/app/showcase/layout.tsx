import { ThemeProvider } from '@/components/ThemeProvider';

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultContext="showcase" defaultMode="dark">
      <div style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Minimal top nav */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: '56px', display: 'flex', alignItems: 'center',
          padding: '0 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,5,6,0.85)', backdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em', color: '#EDEDEF' }}>SAGI</span>
          <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: '#5E6AD2', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Showcase</span>
          <div style={{ flex: 1 }} />
          <a href="/hub/dashboard" style={{
            fontSize: '0.8rem', color: 'rgba(237,237,239,0.6)', textDecoration: 'none',
            padding: '0.375rem 0.875rem', border: '1px solid rgba(94,106,210,0.4)',
            borderRadius: '0.5rem', transition: 'all 150ms',
          }}>Hub →</a>
        </header>
        <div style={{ paddingTop: '56px' }}>
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
