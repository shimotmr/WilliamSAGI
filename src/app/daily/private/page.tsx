import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'

import { FeedTabs } from '@/components/FeedTabs'
import { getPrivatePosts } from '@/lib/content'

export default async function PrivatePage() {
  const posts = await getPrivatePosts()

  return (
    <div className="py-6 space-y-4">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      {/* Private header */}
      <div className="border border-border rounded-2xl bg-card p-5 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-3xl shrink-0">
            <Lock size={32} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl flex items-center gap-2"><Lock size={20} /> Private Posts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Internal reports, drafts, and private notes. Not shown in public feed.
            </p>
            <p className="text-muted-foreground text-sm mt-1.5 border-t border-border/50 pt-1.5">
              內部報告、草稿和私密筆記。不會出現在公開 Feed 中。
            </p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{posts.length}</strong> private posts</span>
              <span>🔐 access-controlled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Feed */}
      {posts.length > 0 ? (
        <FeedTabs posts={posts.map(p => ({
          slug: p.slug,
          title: p.title,
          date: p.date,
          type: p.type,
          tags: p.tags,
          excerpt: p.excerpt,
          cover: p.cover,
        }))} />
      ) : (
        <div className="border border-border rounded-2xl bg-card p-8 text-center text-muted-foreground">
          No private posts yet.
        </div>
      )}
    </div>
  )
}
