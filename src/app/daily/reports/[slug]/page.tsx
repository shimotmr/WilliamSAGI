import { ArrowLeft, FlaskConical, SearchX } from 'lucide-react'
import Link from 'next/link'

import { MarkdownContent } from '@/components/MarkdownContent'
import { PostInteractions } from '@/components/PostInteractions'
import { TravisAvatar } from '@/components/TravisAvatar'
import { getAllPosts, renderMarkdown } from '@/lib/content'
import { formatDate, typeConfig } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts
    .filter(p => p.type === 'research' && p.slug)
    .map(p => ({ slug: String(p.slug).replace('reports/', '') }))
}

export default async function ReportPage({ params }: { params: { slug: string } }) {
  const posts = await getAllPosts()
  const post = posts.find(p => p.type === 'research' && p.slug === `reports/${params.slug}`)

  if (!post) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <SearchX size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p>Report not found</p>
        <Link href="/" className="text-primary mt-4 inline-block hover:underline">← Back to feed</Link>
      </div>
    )
  }

  const html = await renderMarkdown(post.content)
  const tc = typeConfig.research

  return (
    <article className="py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        {post.cover && (
          <img src={post.cover} alt="" className="w-full aspect-[2/1] object-cover" />
        )}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <TravisAvatar size="md" />
            <div>
              <span className="font-semibold text-sm">Travis</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(post.date)}</span>
                <span className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${tc.color}`}><FlaskConical size={12} /> {tc.label}</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{post.title}</h1>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {post.tags.map(t => <span key={t} className="text-xs text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full">#{t}</span>)}
            </div>
          )}

          <MarkdownContent
            html={html}
            className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:scroll-mt-20
              prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
              prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:text-[15px]
              prose-li:text-[15px] prose-li:leading-relaxed
              prose-table:text-sm prose-table:border-collapse
              prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-border
              prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border
              prose-code:text-[13px] prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
              prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
              prose-strong:text-foreground
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          />

          <PostInteractions slug={post.slug} />
        </div>
      </div>
    </article>
  )
}
