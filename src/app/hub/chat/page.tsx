'use client'

import {
  MessageCircle, ArrowLeft, Send, Users, Clock,
  Loader2, RefreshCw, Plus, Link
} from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

import { supabase, type Message as SupabaseMessage } from '@/lib/supabase'

interface Thread {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  created_by: string
  is_active: boolean
  message_count?: number
  task_id?: number
  task_title?: string
}

interface Message {
  id: string
  thread_id: string
  sender: string
  content: string
  timestamp: string
  message_type?: string
  metadata?: any
}

// Dynamic agent configuration generation
const generateAgentConfig = (sender: string) => {
  const colors = [
    '#ef4444', '#3b82f6', '#a855f7', '#f59e0b', '#10b981', 
    '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6', '#84cc16'
  ]
  
  // Known avatar mappings
  const avatarMap: Record<string, string> = {
    designer: 'designer.png',
    architect: 'architect.png', 
    coder: 'coder.png',
    'coder-b': 'coder.png',
    ux: 'ux.png',
    performance: 'performance.png',
    main: 'main.png',
    travis: 'main.png',
    inspector: 'inspector.png',
    secretary: 'secretary.png',
    writer: 'writer.png', 
    researcher: 'researcher.png',
    analyst: 'analyst.png',
    trader: 'trader.png',
  }
  
  // Generate consistent color based on sender name
  let hash = 0
  for (let i = 0; i < sender.length; i++) {
    hash = ((hash << 5) - hash + sender.charCodeAt(i)) & 0xffffffff
  }
  
  return {
    color: colors[Math.abs(hash) % colors.length],
    avatar: avatarMap[sender.toLowerCase()]
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('zh-TW', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function AgentAvatar({ sender, size = 8 }: { sender: string; size?: number }) {
  const config = generateAgentConfig(sender)
  const avatarSize = `w-${size} h-${size}`
  
  return (
    <div className={`${avatarSize} rounded-full overflow-hidden border-2 shrink-0`}
         style={{ borderColor: `${config.color}50` }}>
      {config.avatar ? (
        <Image
          src={`/avatars/${config.avatar}`}
          alt={sender}
          width={size * 4}
          height={size * 4}
          className="object-cover scale-[1.35]"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
             style={{ backgroundColor: config.color }}>
          {sender.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewThreadForm, setShowNewThreadForm] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadDescription, setNewThreadDescription] = useState('')
  const [newThreadTaskId, setNewThreadTaskId] = useState('')
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加載討論串列表
  useEffect(() => {
    fetch('/api/chat/threads')
      .then(res => res.json())
      .then(data => {
        setThreads(data)
        if (data.length > 0 && !selectedThread) {
          setSelectedThread(data[0])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedThread])

  // 加載選中討論串的訊息
  useEffect(() => {
    if (!selectedThread) return
    
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
    let pollInterval: NodeJS.Timeout | null = null
    let isRealtimeConnected = false
    
    const loadMessages = () => {
      if (messagesLoading) return // 避免重複請求
      
      setMessagesLoading(true)
      fetch(`/api/chat/messages?thread_id=${selectedThread.id}`)
        .then(res => res.json())
        .then(data => {
          setMessages(data)
          setMessagesLoading(false)
        })
        .catch(() => {
          setMessages([])
          setMessagesLoading(false)
        })
    }

    // 初次載入
    loadMessages()
    
    // 設定 Supabase Realtime 訂閱
    const setupRealtime = () => {
      console.warn('Setting up Realtime for thread:', selectedThread.id)
      
      realtimeChannel = supabase
        .channel(`agent_messages_${selectedThread.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_messages',
            filter: `thread_id=eq.${selectedThread.id}`
          },
          (payload) => {
            console.warn('🔥 New message received via Realtime:', payload)
            const newMessage = payload.new as SupabaseMessage
            setMessages(prev => [...prev, newMessage])
          }
        )
        .subscribe((status, err) => {
          console.warn('🔄 Realtime subscription status:', status, err)
          if (status === 'SUBSCRIBED') {
            console.warn('✅ Successfully subscribed to agent_messages realtime')
            setRealtimeConnected(true)
            isRealtimeConnected = true
            // 停止 fallback 輪詢
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
              console.warn('🚫 Stopped fallback polling - Realtime is active')
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Failed to subscribe to realtime:', err)
            isRealtimeConnected = false
            setRealtimeConnected(false)
          } else if (status === 'TIMED_OUT') {
            console.error('⏰ Realtime connection timed out')
            isRealtimeConnected = false
            setRealtimeConnected(false)
          } else if (status === 'CLOSED') {
            console.warn('🔒 Realtime connection closed')
            isRealtimeConnected = false
            setRealtimeConnected(false)
          }
        })
    }

    // 設定 Realtime
    setupRealtime()
    
    // 設定 fallback 輪詢（延遲啟動，給 Realtime 時間連接）
    const fallbackTimeout = setTimeout(() => {
      console.warn('🕐 Checking Realtime connection status:', isRealtimeConnected)
      if (!isRealtimeConnected) {
        console.warn('⚠️  Realtime not connected, starting fallback polling every 30s')
        pollInterval = setInterval(() => {
          console.warn('🔄 Fallback polling for messages')
          loadMessages()
        }, 30000) // 30 秒輪詢作為 fallback
      } else {
        console.warn('🎯 Realtime connected, no fallback needed')
      }
    }, 3000) // 3 秒後檢查 Realtime 是否連接成功
    
    return () => {
      // 清理
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout)
      }
    }
  }, [selectedThread, messagesLoading])

  // 自動捲動到最新訊息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleThreadSelect = (thread: Thread) => {
    setSelectedThread(thread)
    setMessages([])
  }

  const refreshMessages = () => {
    if (!selectedThread) return
    setMessagesLoading(true)
    fetch(`/api/chat/messages?thread_id=${selectedThread.id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data)
        setMessagesLoading(false)
      })
      .catch(() => setMessagesLoading(false))
  }

  // 發送訊息
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return
    
    setSending(true)
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: selectedThread.id,
          sender: 'main', // 預設為 main agent
          content: newMessage.trim(),
          message_type: 'text'
        })
      })

      if (response.ok) {
        setNewMessage('')
        // 立即重新載入訊息
        refreshMessages()
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  // 建立新討論串
  const createThread = async () => {
    if (!newThreadTitle.trim()) return

    try {
      const response = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newThreadTitle.trim(),
          description: newThreadDescription.trim() || null,
          created_by: 'main',
          task_id: newThreadTaskId ? parseInt(newThreadTaskId) : null
        })
      })

      if (response.ok) {
        const newThread = await response.json()
        setThreads(prev => [newThread, ...prev])
        setSelectedThread(newThread)
        setShowNewThreadForm(false)
        setNewThreadTitle('')
        setNewThreadDescription('')
        setNewThreadTaskId('')
      }
    } catch (error) {
      console.error('Error creating thread:', error)
    }
  }

  // 處理按 Enter 發送訊息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-foreground-muted text-sm hover:text-foreground transition inline-flex items-center gap-1.5">
                <ArrowLeft size={14} />
                William Hub
              </a>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Agent 聊天室</h1>
                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <Users size={10} />
                    <span>{threads.length} 討論串</span>
                    {selectedThread && (
                      <>
                        <span>·</span>
                        <span>{messages.length} 訊息</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                realtimeConnected 
                  ? 'text-green-600 bg-green-50 border-green-200' 
                  : 'text-yellow-600 bg-yellow-50 border-yellow-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  realtimeConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span>{realtimeConnected ? '即時' : '輪詢'}</span>
              </div>
              <div className="text-xs text-foreground-subtle bg-card px-2 py-1 rounded border">
                Realtime 整合版本
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* 左側：討論串列表 */}
          <div className="w-80 border-r border-border bg-card/30 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">討論串</h2>
                <button
                  onClick={() => setShowNewThreadForm(true)}
                  className="p-1.5 hover:bg-card rounded-lg transition-colors"
                  title="新增討論串"
                >
                  <Plus size={14} className="text-foreground-muted" />
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-foreground-muted" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 新增討論串表單 */}
                  {showNewThreadForm && (
                    <div className="p-3 border border-border rounded-lg bg-card">
                      <h3 className="text-sm font-semibold text-foreground mb-2">新增討論串</h3>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="討論串標題"
                          value={newThreadTitle}
                          onChange={(e) => setNewThreadTitle(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background text-foreground"
                        />
                        <textarea
                          placeholder="描述（選填）"
                          value={newThreadDescription}
                          onChange={(e) => setNewThreadDescription(e.target.value)}
                          rows={2}
                          className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background text-foreground resize-none"
                        />
                        <input
                          type="number"
                          placeholder="關聯任務 ID（選填）"
                          value={newThreadTaskId}
                          onChange={(e) => setNewThreadTaskId(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 border border-border rounded bg-background text-foreground"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={createThread}
                            disabled={!newThreadTitle.trim()}
                            className="flex-1 text-xs py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            建立
                          </button>
                          <button
                            onClick={() => {
                              setShowNewThreadForm(false)
                              setNewThreadTitle('')
                              setNewThreadDescription('')
                              setNewThreadTaskId('')
                            }}
                            className="flex-1 text-xs py-1.5 border border-border rounded hover:bg-card"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 討論串列表 */}
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => handleThreadSelect(thread)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group
                        ${selectedThread?.id === thread.id 
                          ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                          : 'hover:bg-card border border-transparent hover:border-border'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`text-sm font-medium line-clamp-1
                          ${selectedThread?.id === thread.id ? 'text-primary' : 'text-foreground'}
                        `}>
                          {thread.title}
                        </h3>
                        {thread.message_count && (
                          <span className="text-xs text-foreground-subtle bg-background px-2 py-0.5 rounded-full shrink-0 ml-2">
                            {thread.message_count}
                          </span>
                        )}
                      </div>

                      {/* 任務關聯顯示 */}
                      {thread.task_id && (
                        <div className="flex items-center gap-1 mb-1">
                          <Link size={10} className="text-blue-500" />
                          <span className="text-xs text-blue-600">任務 #{thread.task_id}</span>
                        </div>
                      )}

                      {thread.description && (
                        <p className="text-xs text-foreground-subtle line-clamp-2 mb-2">
                          {thread.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <AgentAvatar sender={thread.created_by} size={4} />
                          <span className="text-foreground-muted">{thread.created_by}</span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground-subtle">
                          <Clock size={10} />
                          <span>{timeAgo(thread.updated_at)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側：訊息內容 */}
          <div className="flex-1 flex flex-col">
            {selectedThread ? (
              <>
                {/* 討論串標題 */}
                <div className="border-b border-border px-6 py-4 bg-card/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-foreground">{selectedThread.title}</h2>
                        {selectedThread.task_id && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded-full border border-blue-200">
                            <Link size={10} />
                            <span>任務 #{selectedThread.task_id}</span>
                          </div>
                        )}
                      </div>
                      {selectedThread.description && (
                        <p className="text-sm text-foreground-muted">{selectedThread.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={refreshMessages}
                      className="p-2 hover:bg-card rounded-lg transition-colors"
                      disabled={messagesLoading}
                    >
                      <RefreshCw size={16} className={`text-foreground-muted ${messagesLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* 訊息列表 */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={24} className="animate-spin text-foreground-muted" />
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-6">
                      {messages.map((message, index) => {
                        const config = generateAgentConfig(message.sender)
                        const showAvatar = index === 0 || messages[index - 1].sender !== message.sender
                        
                        return (
                          <div key={message.id} className={`flex gap-3 ${!showAvatar ? 'ml-12' : ''}`}>
                            {showAvatar && (
                              <AgentAvatar sender={message.sender} size={10} />
                            )}
                            <div className="flex-1 min-w-0">
                              {showAvatar && (
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span 
                                    className="text-sm font-semibold" 
                                    style={{ color: config.color }}
                                  >
                                    {message.sender}
                                  </span>
                                  <span className="text-xs text-foreground-subtle">
                                    {formatTime(message.timestamp)}
                                  </span>
                                </div>
                              )}
                              <div className="text-sm text-foreground leading-relaxed">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <MessageCircle size={32} className="text-foreground-muted mx-auto mb-3" />
                        <p className="text-foreground-muted">此討論串暫無訊息</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 訊息輸入框 */}
                <div className="border-t border-border px-6 py-4 bg-card/20">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="輸入訊息..."
                        rows={1}
                        disabled={sending}
                        className="w-full px-3 py-2 border border-border rounded-lg resize-none bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 min-h-10 max-h-32"
                      />
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle size={48} className="text-foreground-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">選擇討論串</h3>
                  <p className="text-foreground-muted">從左側選擇一個討論串開始查看 Agent 之間的對話</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}