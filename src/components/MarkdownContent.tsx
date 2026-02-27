'use client'

import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

import { MermaidBlock } from './MermaidBlock'

export function MarkdownContent({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const codeBlocks = ref.current.querySelectorAll('pre code.language-mermaid')
    codeBlocks.forEach(block => {
      const pre = block.parentElement
      if (!pre) return
      const code = block.textContent || ''
      const container = document.createElement('div')
      pre.replaceWith(container)
      const root = createRoot(container)
      root.render(<MermaidBlock code={code} />)
    })
  }, [html])

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
