'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type ThemeMode = 'light' | 'dark';
type ContextType = 'portal' | 'showcase' | 'hub';
type ThemeValue = `${ContextType}-${ThemeMode}`;

interface ThemeContextType {
  theme: ThemeValue;
  currentMode: ThemeMode;
  context: ContextType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeValue) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getContextFromPath(pathname: string): ContextType {
  if (pathname.startsWith('/portal')) return 'portal';
  if (pathname.startsWith('/showcase')) return 'showcase';
  return 'hub';
}

export function ThemeProvider({
  children,
  defaultContext = 'hub',
  defaultMode = 'dark',
}: {
  children: ReactNode;
  defaultContext?: ContextType;
  defaultMode?: ThemeMode;
}) {
  const pathname = usePathname();
  const context = getContextFromPath(pathname) || defaultContext;
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    const saved = localStorage.getItem('williamsagi-mode') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);

  const theme: ThemeValue = `${context}-${mode}`;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-context', context);
    // Login 頁面強制 light mode
    if (pathname === '/login') {
      document.body.style.background = '#FAFAFA';
      document.body.style.color = '#0F172A';
      return;
    }

    document.body.style.background = mode === 'dark' ? '#050506' : '#FAFAFA';
    document.body.style.color = mode === 'dark' ? '#EDEDEF' : '#0F172A';
  }, [theme, context, mode, pathname]);

  const toggleTheme = () => {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('williamsagi-mode', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, currentMode: mode, context, toggleTheme, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: 'hub-dark',
      currentMode: 'dark',
      context: 'hub',
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
