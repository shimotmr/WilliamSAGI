'use client'

import { LayoutGrid, Newspaper, FlaskConical, StickyNote, MessageCircle, Inbox } from 'lucide-react'
import { useState } from 'react'

import { PostCard } from './PostCard'

import { cn } from '@/lib/utils'

interface Post {
  slug: string
  title: string
  date: string
  type: string
  tags: string[]
  excerpt: string
  cover?: string
}

const tabs = [
  { key: 'all', label: '全部', icon: LayoutGrid },
  { key: 'digest', label: '動態', icon: Newspaper },
  { key: 'research', label: '研究報告', icon: FlaskConical },
  { key: 'note', label: '筆記', icon: StickyNote },
  { key: 'forum', label: '討論', icon: MessageCircle },
]

export function FeedTabs({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState('all')

  const filtered = active === 'all' ? posts : posts.filter(p => p.type === active)

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-4 overflow-x-auto">
        {tabs.map(tab => {
          const count = tab.key === 'all' ? posts.length : posts.filter(p => p.type === tab.key).length
          if (tab.key !== 'all' && count === 0) return null
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                active === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              <span className={cn(
                'text-[11px] px-1.5 py-0.5 rounded-full',
                active === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map(post => (
          <PostCard
            key={post.slug}
            slug={post.slug}
            title={post.title}
            date={post.date}
            type={post.type}
            tags={post.tags}
            excerpt={post.excerpt}
            cover={post.cover}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Inbox size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm">這個分類還沒有文章</p>
          </div>
        )}
      </div>
    </>
  )
}
