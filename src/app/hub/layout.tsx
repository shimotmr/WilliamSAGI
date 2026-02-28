import Header from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultContext="hub">
      <div className="hub-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Desktop Sidebar */}
        <aside
          className="sidebar-desktop"
          style={{
            width: '240px',
            background: 'var(--card)',
            borderRight: '1px solid var(--border)',
            display: 'none',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: 'var(--space-4)' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <a
                href="/hub"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                🏠 儀表板
              </a>
              <a
                href="/hub/tasks"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                📋 任務
              </a>
              <a
                href="/hub/reports"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                📊 報告
              </a>
              <a
                href="/hub/settings"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 500,
                }}
              >
                ⚙️ 設定
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header context="hub" />
          
          <main style={{ flex: 1, padding: 'var(--space-4)' }}>
            <div className="container" style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
              {children}
            </div>
          </main>

          {/* Mobile Bottom Tab Bar */}
          <nav
            className="tab-bar-mobile"
            style={{
              display: 'flex',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--card)',
              borderTop: '1px solid var(--border)',
              padding: 'var(--space-2) 0',
              justifyContent: 'space-around',
              zIndex: 50,
            }}
          >
            <a
              href="/hub"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-4)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                fontSize: 'var(--text-caption)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🏠</span>
              <span>首頁</span>
            </a>
            <a
              href="/hub/tasks"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-4)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                fontSize: 'var(--text-caption)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📋</span>
              <span>任務</span>
            </a>
            <a
              href="/hub/reports"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-4)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                fontSize: 'var(--text-caption)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <span>報告</span>
            </a>
            <a
              href="/hub/settings"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                padding: 'var(--space-2) var(--space-4)',
                color: 'var(--foreground)',
                textDecoration: 'none',
                fontSize: 'var(--text-caption)',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>⚙️</span>
              <span>設定</span>
            </a>
          </nav>

          {/* Spacer for mobile tab bar */}
          <div className="tab-bar-spacer" style={{ height: '64px' }} />
        </div>

        <style jsx>{`
          @media (min-width: 1024px) {
            .sidebar-desktop {
              display: flex !important;
            }
            .tab-bar-mobile,
            .tab-bar-spacer {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </ThemeProvider>
  );
}
