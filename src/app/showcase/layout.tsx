import Header from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider defaultContext="showcase">
      <div className="showcase-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header context="showcase" />
        
        <main style={{ flex: 1 }}>
          <div 
            className="container" 
            style={{ 
              maxWidth: 'var(--container-max)', 
              margin: '0 auto',
              padding: 'var(--space-4)',
            }}
          >
            {children}
          </div>
        </main>

        <footer
          style={{
            padding: 'var(--space-6) var(--space-4)',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)',
            marginTop: 'auto',
          }}
        >
          <div 
            className="container" 
            style={{ 
              maxWidth: 'var(--container-max)', 
              margin: '0 auto',
              textAlign: 'center',
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-body-sm)',
            }}
          >
            <p>© 2026 WilliamSAGI Showcase. Built with Next.js & Design System.</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
