'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Activity, Bell, Swords,
  Bot, CalendarCheck, Kanban,
  BarChart3, Cpu, Coins,
  FileText, CheckSquare, TrendingUp, Sprout,
  MessageSquare, ShieldCheck, User,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft,
  MessageCircle, LayoutGrid, Calendar, Database,
  Menu, X, Car, MapPin, Network, ScanText, GitFork,
} from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  {
    label: '核心監控',
    items: [
      { href: '/hub/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/hub/monitor',   icon: Activity,        label: '系統監控' },
      { href: '/hub/alerts',    icon: Bell,            label: '告警中心' },
      { href: '/hub/warroom',   icon: Swords,          label: '作戰室' },
    ],
  },
  {
    label: 'Agent 管理',
    items: [
      { href: '/hub/agents', icon: Bot,           label: 'Agents' },
      { href: '/hub/today',  icon: CalendarCheck, label: '今日任務' },
      { href: '/hub/board',  icon: Kanban,        label: '任務看板' },
      { href: '/hub/schedule', icon: MapPin,      label: '行程' },
    ],
  },
  {
    label: '資料分析',
    items: [
      { href: '/hub/analytics',    icon: BarChart3, label: '分析' },
      { href: '/hub/model-usage',  icon: Cpu,       label: '模型使用' },
      { href: '/hub/token-usage',  icon: Coins,     label: 'Token 使用' },
    ],
  },
  {
    label: '業務功能',
    items: [
      { href: '/hub/reports',   icon: FileText,    label: '報告' },
      { href: '/hub/approvals', icon: CheckSquare, label: '審批' },
      { href: '/hub/trade',     icon: TrendingUp,  label: '交易' },
      { href: '/hub/growth',    icon: Sprout,      label: '成長' },
      { href: '/hub/tesla',     icon: Car,         label: 'Tesla' },
    ],
  },
  {
    label: 'V4 系統',
    items: [
      { href: '/hub/v4', icon: Activity, label: 'V4 系統中心' },
      { href: '/hub/architecture', icon: Network, label: 'V4 架構圖' },
      { href: '/hub/intel-graph', icon: GitFork, label: '情報關係圖' },
      { href: '/hub/system-refactor', icon: GitFork, label: '架構重整' },
      { href: '/hub/system-architecture', icon: GitFork, label: 'V4.1 架構圖' },
      { href: '/hub/v4-2', icon: GitFork, label: 'V4.2 Pipeline' },
      { href: '/hub/v4-4', icon: GitFork, label: 'V4.4 Pipeline' },
      { href: '/hub/local-models', icon: Cpu, label: '本地模型' },
      { href: '/hub/ocr', icon: ScanText, label: 'OCR 解析' },
      { href: '/hub/chat', icon: MessageSquare, label: '本地 Chat' },
    ],
  },
  {
    label: '系統設定',
    items: [
      { href: '/hub/prompts', icon: MessageSquare, label: 'Prompt 管理' },
      { href: '/hub/rules',   icon: ShieldCheck,   label: '規則' },
      { href: '/hub/wecom',       icon: MessageCircle, label: 'WeCom 歸類' },
      { href: '/hub/wecom-board', icon: LayoutGrid,    label: 'WeCom 看板' },

      { href: '/hub/profile', icon: User,          label: '個人檔案' },
    ],
  },
];

// Flatten for mobile nav (pick top 5)
const mobileLinks = [
  { href: '/hub/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/hub/board',     icon: Kanban,          label: '看板' },
  { href: '/hub/agents',    icon: Bot,             label: 'Agents' },
  { href: '/hub/reports',   icon: FileText,        label: '報告' },
  { href: '/hub/monitor',   icon: Activity,        label: '監控' },
];

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // 交易頁面有自己的底部導航，隱藏 Hub 的
  const isTradeRoute = pathname?.startsWith('/hub/trade');

  const isActive = (href: string) => {
    if (href === '/hub/dashboard') return pathname === '/hub/dashboard' || pathname === '/hub';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <ThemeProvider defaultContext="hub" defaultMode="dark">
      <style>{`
        .hub-sidebar { display: flex; }
        .hub-mobile-nav { display: none; }
        .hub-mobile-spacer { display: none; }
        @media (max-width: 768px) {
          .hub-sidebar { display: none !important; }
          .hub-mobile-nav { display: flex !important; }
          .hub-mobile-spacer { display: block; }
        }
        .hub-nav-link {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.4375rem 0.75rem; border-radius: 0.5rem;
          color: #8A8F98; text-decoration: none;
          font-size: 0.8125rem; font-weight: 500;
          transition: all 150ms ease;
          white-space: nowrap; overflow: hidden;
        }
        .hub-nav-link:hover {
          background: rgba(94,106,210,0.12);
          color: #EDEDEF;
        }
        .hub-nav-link.active {
          background: rgba(94,106,210,0.18);
          color: #EDEDEF;
          box-shadow: inset 0 0 0 1px rgba(94,106,210,0.25);
        }
        .hub-group-label {
          font-size: 0.625rem;
          font-weight: 600;
          color: rgba(138,143,152,0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 0.75rem;
          margin-bottom: 0.375rem;
          margin-top: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
        }
        .hub-collapse-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          color: #8A8F98; cursor: pointer;
          transition: all 150ms ease;
        }
        .hub-collapse-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #EDEDEF;
        }
        .mobile-nav-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.125rem; padding: 0.25rem 0.75rem;
          color: rgba(237,237,239,0.4); text-decoration: none;
          font-size: 0.5625rem; transition: color 150ms;
        }
        .mobile-nav-item.active {
          color: #5E6AD2;
        }
        @media (max-width: 768px) {
          .mobile-hamburger { display: flex !important; }
        }
        .mobile-drawer-overlay {
          display: none;
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 100;
          opacity: 0;
          transition: opacity 250ms ease;
        }
        .mobile-drawer-overlay.open {
          opacity: 1;
        }
        .mobile-drawer {
          display: none;
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 280px;
          background: #0a0a0c;
          border-right: 1px solid rgba(255,255,255,0.08);
          z-index: 110;
          transform: translateX(-100%);
          transition: transform 250ms ease;
          overflow-y: auto;
          flex-direction: column;
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }
        @media (max-width: 768px) {
          .mobile-drawer-overlay, .mobile-drawer { display: flex; }
        }
        .mobile-drawer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1rem 1rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .mobile-drawer-close {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #8A8F98; cursor: pointer;
          transition: all 150ms;
        }
        .mobile-drawer-close:hover {
          background: rgba(255,255,255,0.08);
          color: #EDEDEF;
        }
        .mobile-drawer-logo {
          display: flex; align-items: center;
        }
        .mobile-drawer-logo span {
          font-weight: 700; font-size: 1rem; letter-spacing: -0.02em; color: #EDEDEF;
        }
        .mobile-drawer-logo .badge {
          margin-left: 0.4rem; font-size: 0.65rem;
          color: #5E6AD2; font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .mobile-drawer-nav {
          flex: 1; padding: 0.75rem 0.5rem;
          display: flex; flex-direction: column; gap: 0.25rem;
        }
        .mobile-drawer-group-label {
          font-size: 0.625rem; font-weight: 600;
          color: rgba(138,143,152,0.5);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.75rem 0.75rem 0.375rem;
        }
        .mobile-drawer-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.625rem 0.75rem; border-radius: 8px;
          color: #8A8F98; text-decoration: none;
          font-size: 0.875rem; font-weight: 500;
          transition: all 150ms;
        }
        .mobile-drawer-link:hover {
          background: rgba(94,106,210,0.12);
          color: #EDEDEF;
        }
        .mobile-drawer-link.active {
          background: rgba(94,106,210,0.18);
          color: #EDEDEF;
          box-shadow: inset 0 0 0 1px rgba(94,106,210,0.25);
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#050506', color: '#EDEDEF', fontFamily: 'Inter,system-ui,sans-serif' }}>
        {/* Sidebar — desktop only */}
        <aside className="hub-sidebar" style={{
          width: collapsed ? '60px' : '220px',
          flexShrink: 0,
          flexDirection: 'column',
          background: '#0a0a0c',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '1.25rem 0',
          position: 'relative',
          zIndex: 20,
          transition: 'width 200ms ease',
          overflow: 'hidden',
        }}>
          {/* Logo */}
          <div style={{
            padding: '0 1rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            minHeight: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#EDEDEF' }}>S</span>
              {!collapsed && (
                <>
                  <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#EDEDEF' }}>AGI</span>
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: '#5E6AD2', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Hub</span>
                </>
              )}
            </div>
            {!collapsed && (
              <button className="hub-collapse-btn" onClick={() => setCollapsed(true)} title="收起側欄">
                <PanelLeftClose size={14} />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '0.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', overflowY: 'auto', overflowX: 'hidden' }}>
            {collapsed ? (
              /* Collapsed: icons only */
              <>
                {navGroups.flatMap(g => g.items).map(link => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link key={link.href} href={link.href} title={link.label}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0.5rem', borderRadius: '0.5rem',
                        color: active ? '#EDEDEF' : '#8A8F98',
                        background: active ? 'rgba(94,106,210,0.18)' : 'transparent',
                        textDecoration: 'none', transition: 'all 150ms',
                      }}>
                      <Icon size={16} />
                    </Link>
                  );
                })}
                <div style={{ flex: 1 }} />
                <button className="hub-collapse-btn" onClick={() => setCollapsed(false)} title="展開側欄"
                  style={{ margin: '0 auto' }}>
                  <PanelLeft size={14} />
                </button>
              </>
            ) : (
              /* Expanded: grouped */
              navGroups.map(group => (
                <div key={group.label}>
                  <div className="hub-group-label">{group.label}</div>
                  {group.items.map(link => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link key={link.href} href={link.href}
                        className={`hub-nav-link ${active ? 'active' : ''}`}>
                        <Icon size={16} style={{ flexShrink: 0 }} />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link href="/portal/dashboard" style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.75rem', color: 'rgba(237,237,239,0.4)',
                textDecoration: 'none', transition: 'color 150ms',
              }}>
                <span>⬡</span> Portal →
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                <span style={{ fontSize: '0.75rem', color: 'rgba(237,237,239,0.4)' }}>Travis Online</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <header style={{
            height: '52px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', padding: '0 1.5rem',
            background: 'rgba(255,255,255,0.01)', backdropFilter: 'blur(8px)',
            position: 'sticky', top: 0, zIndex: 40,
          }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="mobile-hamburger"
              style={{
                display: 'none',
                alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px',
                background: 'transparent', border: 'none',
                color: '#EDEDEF', cursor: 'pointer',
                marginRight: '0.75rem', marginLeft: '-0.5rem',
              }}
              aria-label="打開選單"
            >
              <Menu size={22} />
            </button>
            <span style={{ fontSize: '0.75rem', color: 'rgba(237,237,239,0.35)', letterSpacing: '0.04em' }}>WilliamSAGI</span>
            <div style={{ flex: 1 }} />
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', marginRight: '0.5rem' }} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(237,237,239,0.4)' }}>Prod</span>
          </header>
          <main key={pathname} style={{ flex: 1, padding: '1.5rem', overflowX: 'hidden' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
              {children}
            </div>
          </main>
          {!isTradeRoute && <div className="hub-mobile-spacer" style={{ height: '64px' }} />}
        </div>

        {/* Mobile bottom nav — 交易頁面隱藏（使用自己的 tab） */}
        {!isTradeRoute && (
        <nav className="hub-mobile-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#0c0c0e', borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '0.5rem 0', justifyContent: 'space-around',
        }}>
          {mobileLinks.map(link => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`mobile-nav-item ${active ? 'active' : ''}`}>
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        )}

        {/* Mobile drawer overlay */}
        <div 
          className={`mobile-drawer-overlay ${mobileDrawerOpen ? 'open' : ''}`}
          onClick={() => setMobileDrawerOpen(false)}
          style={{ pointerEvents: mobileDrawerOpen ? 'auto' : 'none' }}
        />

        {/* Mobile side drawer */}
        <aside className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`}>
          <div className="mobile-drawer-header">
            <div className="mobile-drawer-logo">
              <span>SAGI</span>
              <span className="badge">Hub</span>
            </div>
            <button className="mobile-drawer-close" onClick={() => setMobileDrawerOpen(false)} aria-label="關閉選單">
              <X size={18} />
            </button>
          </div>
          <nav className="mobile-drawer-nav">
            {navGroups.map(group => (
              <div key={group.label}>
                <div className="mobile-drawer-group-label">{group.label}</div>
                {group.items.map(link => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`mobile-drawer-link ${active ? 'active' : ''}`}
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/portal/dashboard" onClick={() => setMobileDrawerOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.8125rem', color: 'rgba(237,237,239,0.5)',
              textDecoration: 'none', padding: '0.5rem 0',
            }}>
              <span>⬡</span> Portal →
            </Link>
          </div>
        </aside>
      </div>
    </ThemeProvider>
  );
}
