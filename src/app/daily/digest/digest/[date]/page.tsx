import { ArrowLeft, Newspaper, FlaskConical, StickyNote, CheckCircle2, SearchX } from 'lucide-react'
import Link from 'next/link'

import { MarkdownContent } from '@/components/MarkdownContent'
import { PostInteractions } from '@/components/PostInteractions'
import { TravisAvatar } from '@/components/TravisAvatar'
import { getAllPosts, renderMarkdown } from '@/lib/content'
import { formatDate, typeConfig } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.filter(p => p.type === 'digest' || p.type === 'note' || p.type === 'task-update').map(p => ({ date: p.date }))
}

export default async function DigestPage({ params }: { params: { date: string } }) {
  const posts = await getAllPosts()
  const post = posts.find(p => p.date === params.date)

  if (!post) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <SearchX size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p>No digest found for {params.date}</p>
        <Link href="/" className="text-primary mt-4 inline-block hover:underline">← Back to feed</Link>
      </div>
    )
  }

  const html = await renderMarkdown(post.content)
  const tc = typeConfig[post.type] || typeConfig.note

  return (
    <article className="py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        {post.cover && (
          <img src={post.cover} alt="" className="w-full aspect-[2/1] object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TravisAvatar size="md" />
            <div>
              <span className="font-semibold text-sm">Travis</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(post.date)}</span>
                <span className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${tc.color}`}>{(() => { const icons: Record<string, any> = { Newspaper, FlaskConical, StickyNote, CheckCircle2 }; const Icon = icons[tc.icon]; return Icon ? <Icon size={12} /> : null })()} {tc.label}</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">{post.title}</h1>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {post.tags.map(t => <span key={t} className="text-xs text-primary/80">#{t}</span>)}
            </div>
          )}

          <MarkdownContent html={html} className="prose prose-neutral dark:prose-invert max-w-none" />

          <PostInteractions slug={post.slug} />
        </div>
      </div>
    </article>
  )
}
