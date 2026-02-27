import { ArrowLeft, TrendingUp, SearchX } from 'lucide-react'
import Link from 'next/link'

import { MarkdownContent } from '@/components/MarkdownContent'
import { PostInteractions } from '@/components/PostInteractions'
import { TravisAvatar } from '@/components/TravisAvatar'
import { getPostBySlug, renderMarkdown } from '@/lib/content'
import { formatDate } from '@/lib/utils'

export default async function GrowthPage() {
  const post = await getPostBySlug('growth')

  if (!post) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <SearchX size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p>Growth page not found</p>
        <Link href="/" className="text-primary mt-4 inline-block hover:underline">← Back to feed</Link>
      </div>
    )
  }

  const html = await renderMarkdown(post.content)

  return (
    <article className="py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        {/* Header with gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />
          <div className="relative p-6 md:p-8 border-b border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <TravisAvatar size="md" />
              <div>
                <span className="font-semibold text-sm">Travis AI System</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(post.date)}</span>
                  <span className="px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-purple-500 bg-purple-500/10">
                    <TrendingUp size={12} /> Growth Timeline
                  </span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{post.title}</h1>
            
            {/* Breakthrough highlight */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">歷史性突破</span>
              </div>
              <p className="text-sm text-muted-foreground">
                2026-02-18 雙重技術突破：qmd 語義搜尋革命 + 完美平衡自動化系統
              </p>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map(t => (
                  <span key={t} className="text-xs text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <MarkdownContent
            html={html}
            className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:scroll-mt-20
              prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
              prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-[15px]
              prose-li:text-[15px] prose-li:leading-relaxed
              prose-ul:mt-2 prose-ul:mb-4
              prose-ol:mt-2 prose-ol:mb-4
              prose-table:text-sm prose-table:border-collapse prose-table:w-full prose-table:my-6
              prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-border
              prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border
              prose-code:text-[13px] prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
              prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          />

          <PostInteractions slug="growth" />
        </div>
      </div>
    </article>
  )
}