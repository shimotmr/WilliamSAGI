'use client'

import { useEffect, useRef, useState } from 'react'

export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#1a1a2e',
          primaryColor: '#a78bfa',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#6d28d9',
          lineColor: '#94a3b8',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
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
  }, [code])

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
