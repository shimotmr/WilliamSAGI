'use client'

import { ArrowLeft, Send, Users, Radio } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useRef, useCallback } from 'react'

import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase-client'

interface Message {
  id: string
  user_name: string
  user_avatar: string | null
  content: string
  agent_id: string | null
  created_at: string
}

const AGENT_COLORS: Record<string, string> = {
  travis: '#3b82f6',
  blake: '#10b981',
  rex: '#8b5cf6',
  oscar: '#ec4899',
  warren: '#f59e0b',
  griffin: '#ef4444',
}

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function ChatBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const accentColor = msg.agent_id ? AGENT_COLORS[msg.agent_id] || '#6b7280' : '#3b82f6'

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {msg.user_avatar ? (
        <img
          src={msg.user_avatar}
          alt=""
          className="w-9 h-9 rounded-full shrink-0"
          style={{ boxShadow: `0 0 0 2px ${accentColor}60` }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: accentColor }}
        >
          {msg.user_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold" style={{ color: accentColor }}>
            {msg.user_name}
          </span>
          {msg.agent_id && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              AI
            </span>
          )}
          <span className="text-[10px] text-gray-600">{relTime(msg.created_at)}</span>
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? 'bg-blue-600/20 text-blue-100 rounded-tr-md'
              : msg.agent_id
              ? 'bg-gray-800/80 text-gray-200 rounded-tl-md border border-gray-700/50'
              : 'bg-gray-800/60 text-gray-200 rounded-tl-md'
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  )
}

export default function MeetingPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [online] = useState(6) // Agent count
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch initial messages
  useEffect(() => {
    fetch('/api/meeting?meeting=general&limit=200')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data)
        setLoading(false)
        setTimeout(scrollToBottom, 100)
      })
      .catch(() => setLoading(false))
  }, [scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('meeting-general')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_messages',
          filter: 'meeting_id=eq.general',
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, scrollToBottom])

  const submit = async () => {
    if (!user || !text.trim() || sending) return
    setSending(true)

    const userName = user.user_metadata?.user_name || user.email || 'Anonymous'
    const userAvatar = user.user_metadata?.avatar_url || ''

    await supabase.from('meeting_messages').insert({
      meeting_id: 'general',
      user_name: userName,
      user_avatar: userAvatar,
      content: text.trim(),
    })

    setText('')
    setSending(false)
  }

  const currentUserName = user?.user_metadata?.user_name || user?.email || ''

  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-base font-semibold flex items-center gap-2">
                <Users size={18} className="text-primary" />
                Agent 會議室
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Radio size={10} className="text-emerald-400 animate-pulse" />
                <span>{online + 1} members online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20">
              <Users size={40} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">會議室空無一人</p>
              <p className="text-muted-foreground text-xs mt-1">發送第一則訊息開始討論</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                isOwn={!msg.agent_id && msg.user_name === currentUserName}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {user ? (
            <div className="flex gap-3 items-end">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="輸入訊息... (Enter 送出, Shift+Enter 換行)"
                rows={1}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/30 resize-none"
              />
              <button
                onClick={submit}
                disabled={!text.trim() || sending}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-2">
              登入即可加入討論
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
