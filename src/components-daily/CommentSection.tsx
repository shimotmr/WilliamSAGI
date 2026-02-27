'use client'

import { MessageCircle, Send, Reply, X, CornerDownRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from './AuthProvider'

import { createClient } from '@/lib/supabase-client'

interface Comment {
  id: string
  user_name: string
  user_avatar: string
  content: string
  created_at: string
  agent_id?: string
  parent_id?: string
  replies?: Comment[]
}

interface FlatComment extends Comment {
  replyToName?: string
  threadId: string // root comment id for grouping
  isReply: boolean
}

// Flatten nested comments, preserving thread grouping
function flattenComments(comments: Comment[]): FlatComment[] {
  const flat: FlatComment[] = []

  function walk(list: Comment[], threadId: string, parentName?: string) {
    for (const c of list) {
      flat.push({
        ...c,
        replyToName: parentName,
        threadId,
        isReply: !!parentName,
      })
      if (c.replies && c.replies.length > 0) {
        walk(c.replies, threadId, c.user_name)
      }
    }
  }

  for (const c of comments) {
    walk([c], c.id)
  }

  return flat
}

export function CommentSection({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(true)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const supabase = createClient()

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
    if (res.ok) {
      const data = await res.json()
      setComments(data)
    }
  }

  useEffect(() => {
    if (show) fetchComments()
  }, [slug, show])

  const submit = async () => {
    if (!user || !text.trim() || loading) return
    setLoading(true)
    await supabase.from('travis_daily_comments').insert({
      post_slug: slug,
      user_id: user.id,
      user_name: user.user_metadata?.user_name || user.email || 'Anonymous',
      user_avatar: user.user_metadata?.avatar_url || '',
      content: text.trim(),
      parent_id: replyTo?.id || null,
    })
    setText('')
    setReplyTo(null)
    await fetchComments()
    setLoading(false)
  }

  const relTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const flat = flattenComments(comments)

  return (
    <div className="mt-6">
      <button
        onClick={() => setShow(!show)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle size={16} />
        <span>{show ? 'Hide' : 'Show'} comments ({flat.length})</span>
      </button>

      {show && (
        <div className="mt-4 space-y-0">
          {/* Comment input */}
          {user ? (
            <div className="mb-4">
              {replyTo && (
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <Reply size={12} />
                  <span>Replying to <strong>{replyTo.name}</strong></span>
                  <button onClick={() => setReplyTo(null)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                </div>
              )}
              <div className="flex gap-3">
                {user.user_metadata?.avatar_url && (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                )}
                <div className="flex-1 flex gap-2">
                  <textarea
                    value={text}
                    onChange={e => {
                      setText(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submit()
                      }
                    }}
                    placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Write a comment...'}
                    rows={3}
                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/30 resize-none"
                  />
                  <button
                    onClick={submit}
                    disabled={!text.trim() || loading}
                    className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">Login to leave a comment</p>
          )}

          {/* Flat comments list with thread lines */}
          {flat.map((c, i) => {
            // Check if next comment is in same thread (for drawing connecting line)
            const nextInThread = i + 1 < flat.length && flat[i + 1].threadId === c.threadId && flat[i + 1].isReply

            return (
              <div key={c.id} className="relative">
                {/* Thread connector line (left side) for replies */}
                {c.isReply && (
                  <div
                    className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-border/60"
                    style={{ top: 0, bottom: nextInThread ? 0 : '50%' }}
                  />
                )}
                {/* Connector line from previous to this reply */}
                {!c.isReply && i > 0 && flat[i - 1]?.threadId !== c.threadId && (
                  <div className="h-2" />
                )}

                <div className={`py-3 ${!c.isReply && i > 0 ? 'border-t border-border/40' : ''}`}>
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      {c.user_avatar ? (
                        <img src={c.user_avatar} alt="" className="w-9 h-9 rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {c.user_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      {/* Vertical line below avatar for parent with replies */}
                      {!c.isReply && nextInThread && (
                        <div className="absolute left-1/2 top-full w-[2px] h-3 bg-border/60 -translate-x-1/2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{c.user_name}</span>
                        {c.agent_id && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">
                            AI Agent
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{relTime(c.created_at)}</span>
                      </div>
                      {c.replyToName && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <CornerDownRight size={10} className="text-primary/50" />
                          <span className="text-primary/70">{c.replyToName}</span>
                        </div>
                      )}
                      <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                      <button
                        onClick={() => setReplyTo({ id: c.id, name: c.user_name })}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Reply size={12} />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {flat.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">No comments yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
