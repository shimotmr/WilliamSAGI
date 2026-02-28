'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

type ContextType = 'portal' | 'showcase' | 'hub';

interface HeaderProps {
  context: ContextType;
}

interface NavItem {
  label: string;
  href: string;
}

// Navigation items for each context
const navItems: Record<ContextType, NavItem[]> = {
  portal: [
    { label: '首頁', href: '/portal' },
    { label: 'Daily', href: '/portal/daily' },
    { label: '知識庫', href: '/portal/knowledge' },
    { label: '關於', href: '/portal/about' },
  ],
  showcase: [
    { label: '首頁', href: '/showcase' },
    { label: '功能', href: '/showcase/features' },
    { label: '元件', href: '/showcase/components' },
    { label: '系統架構', href: '/showcase/architecture' },
    { label: '關於', href: '/showcase/about' },
  ],
  hub: [
    { label: '儀表板', href: '/hub' },
    { label: '任務', href: '/hub/tasks' },
    { label: '報告', href: '/hub/reports' },
    { label: '設置', href: '/hub/settings' },
  ],
};

const contextLabels: Record<ContextType, string> = {
  portal: 'Portal',
  showcase: 'Showcase',
  hub: 'Hub',
};

export default function Header({ context }: HeaderProps) {
  const pathname = usePathname();
  const { theme, toggleTheme, currentMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDark = currentMode === 'dark';
  const currentNavItems = navItems[context];

  const isActive = (href: string) => {
    if (href === `/${context}`) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        height: '64px',
        padding: '0 var(--space-4)',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            textDecoration: 'none',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'var(--text-h5)',
            color: 'var(--foreground)',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
            }}
          >
            W
          </span>
          <span>SAGI</span>
        </Link>

        {/* Context Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--space-1) var(--space-3)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: '9999px',
            fontSize: 'var(--text-caption)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {contextLabels[context]}
        </span>
      </div>

      {/* Desktop Navigation */}
      <nav
        style={{
          display: 'none',
          alignItems: 'center',
          gap: 'var(--space-1)',
        }}
        className="desktop-nav"
      >
        {currentNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 500,
              color: isActive(item.href) ? 'var(--primary)' : 'var(--muted-foreground)',
              background: isActive(item.href) ? 'oklch(from var(--primary) l c h / 0.1)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.href)) {
                e.currentTarget.style.color = 'var(--foreground)';
                e.currentTarget.style.background = 'var(--muted)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.href)) {
                e.currentTarget.style.color = 'var(--muted-foreground)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right Section - Theme Toggle & Mobile Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--secondary)';
          }}
          aria-label={isDark ? '切換到淺色模式' : '切換到深色模式'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: mobileMenuOpen ? 'var(--muted)' : 'var(--secondary)',
            color: 'var(--secondary-foreground)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!mobileMenuOpen) {
              e.currentTarget.style.background = 'var(--muted)';
            }
          }}
          onMouseLeave={(e) => {
            if (!mobileMenuOpen) {
              e.currentTarget.style.background = 'var(--secondary)';
            }
          }}
          className="mobile-menu-btn"
          aria-label="選單"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--background)',
            zIndex: 40,
            padding: 'var(--space-4)',
          }}
          className="mobile-menu"
        >
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {currentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-body)',
                  fontWeight: 500,
                  color: isActive(item.href) ? 'var(--primary)' : 'var(--foreground)',
                  background: isActive(item.href) ? 'oklch(from var(--primary) l c h / 0.1)' : 'var(--card)',
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
