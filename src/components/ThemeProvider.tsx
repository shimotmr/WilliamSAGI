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

interface ThemeProviderProps {
  children: ReactNode;
  defaultContext?: ContextType;
}

// Get context from pathname
function getContextFromPath(pathname: string): ContextType {
  if (pathname.startsWith('/portal')) return 'portal';
  if (pathname.startsWith('/showcase')) return 'showcase';
  if (pathname.startsWith('/hub')) return 'hub';
  return 'portal'; // default fallback
}

// Detect system preference
function getSystemMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children, defaultContext = 'portal' }: ThemeProviderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<ThemeValue>(`${defaultContext}-light`);
  const [context, setContext] = useState<ContextType>(defaultContext);
  const [currentMode, setCurrentMode] = useState<ThemeMode>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    const savedTheme = localStorage.getItem('williamsagi-theme') as ThemeValue | null;
    const savedMode = localStorage.getItem('williamsagi-mode') as ThemeMode | null;
    
    const detectedContext = getContextFromPath(pathname);
    setContext(detectedContext);
    
    let mode: ThemeMode;
    if (savedMode && ['light', 'dark'].includes(savedMode)) {
      mode = savedMode;
    } else if (savedTheme) {
      // Extract mode from old theme format
      const parts = savedTheme.split('-');
      mode = parts[parts.length - 1] === 'dark' ? 'dark' : 'light';
    } else {
      mode = getSystemMode();
    }
    
    setCurrentMode(mode);
    setThemeState(`${detectedContext}-${mode}`);
  }, [pathname]);

  // Update theme when pathname changes (context switch)
  useEffect(() => {
    if (!mounted) return;
    
    const newContext = getContextFromPath(pathname);
    if (newContext !== context) {
      setContext(newContext);
      setThemeState(`${newContext}-${currentMode}`);
    }
  }, [pathname, mounted, context, currentMode]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('williamsagi-theme', theme);
    localStorage.setItem('williamsagi-mode', currentMode);
  }, [theme, currentMode, mounted]);

  // Listen for system preference changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set preference
      const hasUserPreference = localStorage.getItem('williamsagi-user-pref') === 'true';
      if (!hasUserPreference) {
        const newMode = e.matches ? 'dark' : 'light';
        setCurrentMode(newMode);
        setThemeState(`${context}-${newMode}`);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, context]);

  const toggleTheme = () => {
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 'light';
    setCurrentMode(newMode);
    setThemeState(`${context}-${newMode}`);
    localStorage.setItem('williamsagi-user-pref', 'true');
  };

  const setTheme = (newTheme: ThemeValue) => {
    setThemeState(newTheme);
    const parts = newTheme.split('-');
    const mode = parts[parts.length - 1] as ThemeMode;
    setCurrentMode(mode);
    localStorage.setItem('williamsagi-user-pref', 'true');
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, currentMode, context, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
