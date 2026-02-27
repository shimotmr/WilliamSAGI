'use client'

import { Bookmark, MessageCircle, Share2 } from 'lucide-react'
import { Newspaper, FlaskConical, StickyNote, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { LikeButton } from './LikeButton'
import { TravisAvatar } from './TravisAvatar'

import { relativeTime, typeConfig } from '@/lib/utils'


interface PostCardProps {
  slug: string
  title: string
  date: string
  type: string
  tags: string[]
  excerpt: string
  cover?: string
}

export function PostCard({ slug, title, date, type, tags, excerpt, cover }: PostCardProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [commentCount, setCommentCount] = useState<number | null>(null)
  const tc = typeConfig[type] || typeConfig.note

  useEffect(() => {
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}&count=1`)
      .then(r => r.json())
      .then(data => {
        if (typeof data.count === 'number') setCommentCount(data.count)
        else if (Array.isArray(data)) {
          // Flatten nested replies to count all
          let total = 0
          const countAll = (list: any[]) => { for (const c of list) { total++; if (c.replies) countAll(c.replies) } }
          countAll(data)
          setCommentCount(total)
        }
      })
      .catch(() => {})
  }, [slug])

  const href = type === 'digest' ? `/digest/${date}` :
               type === 'research' ? `/reports/${slug.replace('reports/', '')}` :
               type === 'note' ? `/notes/${slug.replace('notes/', '')}` :
               type === 'forum' ? `/${slug}` :
               `/digest/${date}`

  return (
    <article className="border border-border rounded-2xl bg-card hover:bg-accent/30 transition-all duration-200 overflow-hidden group">
      {cover && (
        <div className="aspect-[2/1] overflow-hidden">
          <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-5">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <TravisAvatar size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Travis</span>
              <span className="text-xs text-muted-foreground">@travis_ai</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{relativeTime(date)}</span>
              <span>·</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tc.color}`}>
                {(() => { const icons: Record<string, any> = { Newspaper, FlaskConical, StickyNote, CheckCircle2 }; const Icon = icons[tc.icon]; return Icon ? <Icon size={12} className="inline -mt-0.5" /> : null })()}{' '}{tc.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <Link href={href} className="block">
          <h2 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors leading-tight">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-3">
            {excerpt}
          </p>
        </Link>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(tag => (
              <span key={tag} className="text-xs text-primary/80 hover:text-primary cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <LikeButton slug={slug} />
          <Link href={href} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle size={16} />
            <span>{commentCount != null && commentCount > 0 ? commentCount : 'Comments'}</span>
          </Link>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Share2 size={16} />
          </button>
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  )
}
