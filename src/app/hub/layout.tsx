import Header from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';

const navLinks = [
  { href: '/hub/dashboard', icon: '📊', label: 'Dashboard', mobileLabel: '儀表板' },
  { href: '/hub/board', icon: '📋', label: '任務看板', mobileLabel: '任務' },
  { href: '/hub/monitor', icon: '📈', label: '系統監控', mobileLabel: '監控' },
  { href: '/hub/agents', icon: '🤖', label: 'Agents', mobileLabel: 'Agents' },
  { href: '/hub/reports', icon: '📑', label: '報告', mobileLabel: '報告' },
  { href: '/hub/trade', icon: '💹', label: '交易', mobileLabel: '交易' },
  { href: '/hub/settings', icon: '⚙️', label: '設定', mobileLabel: null },
];

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultContext="hub">
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Desktop Sidebar — hidden on mobile via inline media not supported; use Tailwind class */}
        <aside className="hidden lg:flex" style={{
          width: '240px',
          background: 'var(--card)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '1.5rem 1rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Navigation</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navLinks.map(link => (
                <a key={link.href} href={link.href} style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                }}>
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header context="hub" />
          <main style={{ flex: 1, padding: '1rem' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
              {children}
            </div>
          </main>

          {/* Mobile Bottom Tab Bar */}
          <nav className="flex lg:hidden" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            padding: '0.5rem 0',
            justifyContent: 'space-around',
            zIndex: 50,
          }}>
            {navLinks.filter(l => l.mobileLabel).map(link => (
              <a key={link.href} href={link.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.25rem', padding: '0.5rem 1rem',
                color: 'var(--foreground)', textDecoration: 'none', fontSize: '0.75rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{link.icon}</span>
                <span>{link.mobileLabel}</span>
              </a>
            ))}
          </nav>
          <div className="block lg:hidden" style={{ height: '64px' }} />
        </div>
      </div>
    </ThemeProvider>
  );
}
