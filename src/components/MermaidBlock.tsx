'use client'

import { useEffect, useRef, useState } from 'react'

type MermaidTheme = 'dark' | 'light'

export function MermaidBlock({ code, theme = 'dark' }: { code: string; theme?: MermaidTheme }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('mermaid').then(({ default: mermaid }) => {
      const isDark = theme === 'dark'
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'base',
        themeVariables: {
          darkMode: isDark,
          background: isDark ? '#1a1a2e' : '#ffffff',
          primaryColor: isDark ? '#a78bfa' : '#dbeafe',
          primaryTextColor: isDark ? '#e2e8f0' : '#111827',
          primaryBorderColor: isDark ? '#6d28d9' : '#2563eb',
          lineColor: isDark ? '#94a3b8' : '#475569',
          secondaryColor: isDark ? '#1e293b' : '#eff6ff',
          tertiaryColor: isDark ? '#0f172a' : '#f8fafc',
        },
        gantt: { useWidth: 800 },
        flowchart: { useMaxWidth: true, htmlLabels: true },
      })
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
      mermaid.render(id, code.trim()).then(({ svg }) => {
        if (!cancelled) setSvg(svg)
      }).catch(() => {
        if (!cancelled) setError(true)
      })
    })
    return () => { cancelled = true }
  }, [code, theme])

  if (error) {
    return <pre className="text-xs overflow-x-auto p-4 bg-muted/30 rounded-lg"><code>{code}</code></pre>
  }

  if (!svg) {
    return <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading diagram...</div>
  }

  return (
    <div
      ref={ref}
      className="my-4 overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
