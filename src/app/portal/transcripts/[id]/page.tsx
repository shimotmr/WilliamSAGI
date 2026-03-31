'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'

import { supabase } from '@/lib/supabase'

interface Transcript {
  id: string
  title: string | null
  meeting_date: string | null
  duration_seconds: number | null
  audio_filename: string | null
  status: string
  speakers: Record<string, string> | null
  created_at: string
}

interface Segment {
  id: string
  transcript_id: string
  speaker: string
  text: string
  edited_text: string | null
  start_ms: number
  end_ms: number
  confidence: number | null
  is_reviewed: boolean
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  uploading: { label: '上傳中', color: '#D97706', bg: '#FEF3C7' },
  processing: { label: '轉錄中', color: '#2563EB', bg: '#DBEAFE' },
  ready: { label: '已完成', color: '#059669', bg: '#D1FAE5' },
  reviewed: { label: '已校閱', color: '#7C3AED', bg: '#EDE9FE' },
  error: { label: '錯誤', color: '#DC2626', bg: '#FEE2E2' },
}

export default function TranscriptDetailPage() {
  const params = useParams()
  const id = params.id as string
  const audioRef = useRef<HTMLAudioElement>(null)

  const [transcript, setTranscript] = useState<Transcript | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [correcting, setCorrecting] = useState(false)
  const [polling, setPolling] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [addToDict, setAddToDict] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [polishProgress, setPolishProgress] = useState(0)
  const [polishMessage, setPolishMessage] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null)

  const loadTranscript = useCallback(async () => {
    setLoading(true)
    
    // Load transcript
    const { data: t } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (t) {
      setTranscript(t)
      
      // Load audio URL
      if (t.audio_filename) {
        const filename = `${t.id}.${t.audio_filename.split('.').pop()}`
        const { data: urlData } = supabase.storage
          .from('transcripts')
          .getPublicUrl(filename)
        setAudioUrl(urlData.publicUrl)
      }
      
      // Load segments
      const { data: segs } = await supabase
        .from('transcript_segments')
        .select('*')
        .eq('transcript_id', id)
        .order('start_ms', { ascending: true })
      
      setSegments(segs || [])

      // Auto-populate speakers from segments if empty
      if ((!t.speakers || Object.keys(t.speakers).length === 0) && segs && segs.length > 0) {
        const uniqueSpeakers = Array.from(new Set(segs.map((s: Segment) => s.speaker))).sort()
        const speakersMap: Record<string, string> = {}
        uniqueSpeakers.forEach(label => { speakersMap[label] = label })
        await supabase.from('transcripts').update({ speakers: speakersMap }).eq('id', id)
        t.speakers = speakersMap
        setTranscript({ ...t })
      }
    }
    
    setLoading(false)
  }, [id])

  const checkStatus = useCallback(async () => {
    setPolling(true)
    const res = await fetch(`/api/transcripts/${id}/status`)
    if (res.ok) {
      const data = await res.json()
      if (data.status !== transcript?.status) {
        loadTranscript()
      }
    }
    setPolling(false)
  }, [id, loadTranscript, transcript?.status])

  useEffect(() => {
    loadTranscript()
    const interval = setInterval(() => {
      if (transcript?.status === 'processing') {
        checkStatus()
      }
    }, 5000)

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', checkMobile)
    }
  }, [checkStatus, loadTranscript, transcript?.status])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000)
    }
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const seekToTime = (ms: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (d: string | null) => {
    if (!d) return '未設定'
    const date = new Date(d)
    return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
  }

  const [editingSpeaker, setEditingSpeaker] = useState('')

  const handleEditStart = (seg: Segment) => {
    setEditingId(seg.id)
    setEditingText(seg.edited_text || seg.text)
    setEditingSpeaker(seg.speaker)
  }

  const handleEditSave = async (segId: string) => {
    const seg = segments.find(s => s.id === segId)
    const updates: Record<string, string> = { edited_text: editingText }
    if (seg && editingSpeaker !== seg.speaker) {
      updates.speaker = editingSpeaker
    }
    await supabase
      .from('transcript_segments')
      .update(updates)
      .eq('id', segId)
    
    setSegments(segments.map(s => s.id === segId ? { ...s, edited_text: editingText, speaker: editingSpeaker } : s))
    setEditingId(null)
  }

  const handleCorrect = async () => {
    setCorrecting(true)
    try {
      const res = await fetch(`/api/transcripts/${id}/correct`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      showToast('辭典校正完成')
      loadTranscript()
    } catch (err) {
      showToast('校正失敗：' + (err as Error).message)
    } finally {
      setCorrecting(false)
    }
  }

  const handleReplace = async () => {
    if (!searchText) {
      showToast('請輸入搜尋文字')
      return
    }
    
    setReplacing(true)
    try {
      const res = await fetch(`/api/transcripts/${id}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: searchText, replace: replaceText, addToDict })
      })
      
      if (!res.ok) throw new Error(await res.text())
      
      const data = await res.json()
      showToast(`已替換 ${data.replacedCount} 段${data.addedToDict ? '，並加入辭典' : ''}`)
      loadTranscript()
      setSearchText('')
      setReplaceText('')
      setAddToDict(false)
      setShowReplace(false)
    } catch (err) {
      showToast('取代失敗：' + (err as Error).message)
    } finally {
      setReplacing(false)
    }
  }

  const handlePolish = async () => {
    if (!confirm('AI 將修正標點、空格和語句，確認執行？')) return
    
    setPolishing(true)
    setPolishProgress(0)
    setPolishMessage('啟動中...')
    
    try {
      const res = await fetch(`/api/transcripts/${id}/polish`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const text = decoder.decode(value)
          const lines = text.split('\n').filter(l => l.startsWith('data: '))
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'progress') {
                setPolishProgress(data.progress)
                setPolishMessage(`${data.completed}/${data.total} 批次，已修正 ${data.polished} 段`)
              } else if (data.type === 'waiting') {
                setPolishMessage(data.message)
              } else if (data.type === 'done') {
                showToast(`AI 潤稿完成，修正了 ${data.polishedCount} 段`)
                loadTranscript()
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      showToast('潤稿失敗：' + (err as Error).message)
    } finally {
      setPolishing(false)
      setPolishProgress(0)
      setPolishMessage('')
    }
  }

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const updateSpeakerName = async (oldLabel: string, newName: string) => {
    if (!newName || !transcript) return
    
    const newSpeakers = { ...(transcript.speakers || {}), [oldLabel]: newName }
    await supabase
      .from('transcripts')
      .update({ speakers: newSpeakers })
      .eq('id', id)
    
    setTranscript({ ...transcript, speakers: newSpeakers })
  }

  const getSpeakerName = (label: string) => {
    return transcript?.speakers?.[label] || label
  }

  const reassignSpeaker = async (segId: string, newSpeaker: string) => {
    await supabase
      .from('transcript_segments')
      .update({ speaker: newSpeaker })
      .eq('id', segId)
    setSegments(segments.map(s => s.id === segId ? { ...s, speaker: newSpeaker } : s))
    setEditingSpeakerId(null)
  }

  const allSpeakerLabels = transcript ? Object.keys(transcript.speakers || {}) : []

  const addSpeaker = async () => {
    if (!transcript) return
    const existing = Object.keys(transcript.speakers || {})
    // Find next available label: Speaker A, B, C...
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let nextLabel = ''
    for (const ch of alphabet) {
      const label = `Speaker ${ch}`
      if (!existing.includes(label)) { nextLabel = label; break }
    }
    if (!nextLabel) return
    const newSpeakers = { ...(transcript.speakers || {}), [nextLabel]: '' }
    await supabase.from('transcripts').update({ speakers: newSpeakers }).eq('id', id)
    setTranscript({ ...transcript, speakers: newSpeakers })
  }

  const highlightText = (text: string) => {
    if (!searchText || !showReplace) return text
    
    const parts = text.split(new RegExp(`(${searchText})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === searchText.toLowerCase() 
        ? `<mark class="bg-yellow-200">${part}</mark>`
        : part
    ).join('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-1 flex justify-center items-center text-text-tertiary">
        載入中...
      </div>
    )
  }

  if (!transcript) {
    return (
      <div className="min-h-screen bg-surface-1 flex justify-center items-center text-red-600">
        找不到逐字稿
      </div>
    )
  }

  const st = STATUS_MAP[transcript.status] || STATUS_MAP.ready
  const headerHeight = isMobile ? (audioUrl ? '140px' : '60px') : (audioUrl ? '120px' : '60px')

  return (
    <div className="min-h-screen bg-surface-1 pt-[var(--header-height)] pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-20" style={{ '--header-height': headerHeight } as React.CSSProperties}>
      {/* Header + Audio Player - 固定頂部 */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-surface-0 border-b border-surface-3 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 md:px-4 py-3">
          <div className={`flex items-center gap-2 md:gap-3 ${audioUrl ? (isMobile ? 'mb-3' : 'mb-[10px]') : ''}`}>
            <Link href="/transcripts" className="text-text-tertiary shrink-0">
              <svg className={`w-[18px] h-[18px] md:w-5 md:h-5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="flex-1 text-sm md:text-lg font-bold text-text-primary truncate">
              {transcript.title || `逐字稿 ${transcript.id.slice(0, 8)}`}
            </h1>
            <span
              className={`px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium shrink-0 whitespace-nowrap`}
              style={{ backgroundColor: st.bg, color: st.color }}
            >
              {st.label}
            </span>
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <div className="bg-surface-1 rounded-lg p-2.5 md:p-2.5">
              {isMobile ? (
                <div>
                  {/* 隱藏的 audio 元素 */}
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  
                  {/* 自訂播放器 UI */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className="w-13 h-13 md:w-12 md:h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shrink-0"
                      style={{ width: '52px', height: '52px' }}
                    >
                      {isPlaying ? '' : ''}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm text-text-secondary mb-1.5">
                        {formatTime(currentTime)} / {formatTime((transcript.duration_seconds || 0) * 1000)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={(transcript.duration_seconds || 0) * 1000}
                        value={currentTime}
                        onInput={e => {
                          const time = parseInt((e.target as HTMLInputElement).value)
                          setCurrentTime(time)
                          if (audioRef.current) {
                            audioRef.current.currentTime = time / 1000
                          }
                        }}
                        className="w-full h-1.5 rounded-full outline-none"
                        style={{ 
                          background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(currentTime / ((transcript.duration_seconds || 1) * 1000)) * 100}%, #E5E7EB ${(currentTime / ((transcript.duration_seconds || 1) * 1000)) * 100}%, #E5E7EB 100%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="w-full h-10"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 md:px-4 py-3 md:py-4">
        {/* Info Card */}
        <div className="bg-surface-0 border border-surface-3 rounded-2xl p-4 md:p-4 mb-4">
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 text-sm md:text-sm`}>
            <div>
              <div className="text-text-secondary text-xs md:text-xs mb-1.5">會議日期</div>
              <div className="text-text-primary font-medium">{formatDate(transcript.meeting_date)}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs md:text-xs mb-1.5">時長</div>
              <div className="text-text-primary font-medium">
                {transcript.duration_seconds ? formatTime(transcript.duration_seconds * 1000) : '--:--'}
              </div>
            </div>
            <div>
              <div className="text-text-secondary text-xs md:text-xs mb-1.5">建立時間</div>
              <div className="text-text-primary font-medium">{formatDate(transcript.created_at)}</div>
            </div>
          </div>

          {/* Speaker List */}
          <div className="mt-4 border-t border-surface-3 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-text-secondary text-xs md:text-xs">與會人員</div>
              <button
                onClick={addSpeaker}
                className="bg-none border border-surface-3 rounded-md px-2.5 py-1.5 text-xs text-text-secondary cursor-pointer min-h-8"
              >
                + 新增
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {Object.keys(transcript?.speakers || {}).map(label => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="text-xs text-text-tertiary w-20 shrink-0">
                      {label}
                    </span>
                    <input
                      type="text"
                      defaultValue={transcript.speakers?.[label] || label}
                      onBlur={e => updateSpeakerName(label, e.target.value)}
                      className="flex-1 border border-surface-3 rounded-md bg-surface-0 px-3 py-2 text-sm text-text-primary font-medium min-h-10"
                    />
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {transcript.status === 'processing' && (
          <div className="bg-blue-100 border border-blue-300 rounded-2xl p-4 md:p-4 mb-4 text-sm md:text-sm text-blue-800">
             轉錄中... {polling && '(檢查狀態中)'}
          </div>
        )}

        {transcript.status === 'error' && (
          <div className="bg-red-100 border border-red-300 rounded-2xl p-4 md:p-4 mb-4 text-sm md:text-sm text-red-800">
             轉錄失敗，請重新上傳
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div className="bg-surface-0 border border-surface-3 rounded-2xl p-4 md:p-4">
            <div className="flex justify-between items-center mb-4 md:mb-4 gap-3">
              <h2 className="text-sm md:text-sm font-bold text-text-primary"> 逐字稿內容</h2>
              <button
                onClick={handleCorrect}
                disabled={correcting}
                className="bg-purple-600 text-white px-3 md:px-3 py-1.5 md:py-1.5 rounded-md text-xs md:text-sm border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-11 whitespace-nowrap"
              >
                {correcting ? '校正中...' : ' 辭典校正'}
              </button>
            </div>

            <div className="flex flex-col gap-3 md:gap-3">
              {segments.map(seg => {
                const isActive = currentTime >= seg.start_ms && currentTime <= seg.end_ms
                const isEditing = editingId === seg.id
                const displayText = seg.edited_text || seg.text

                return (
                  <div
                    key={seg.id}
                    className={`p-3 md:p-3 rounded-xl border transition-all ${isActive ? 'bg-blue-50 border-blue-600' : 'bg-surface-1 border-surface-3'}`}
                    style={{ minHeight: isMobile ? '80px' : 'auto' }}
                  >
                    <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
                      <button
                        onClick={() => seekToTime(seg.start_ms)}
                        className="text-blue-600 text-xs md:text-xs font-mono bg-none border-none cursor-pointer shrink-0 min-h-11 px-2 py-2 font-semibold"
                      >
                        {formatTime(seg.start_ms)}
                      </button>
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setEditingSpeakerId(editingSpeakerId === seg.id ? null : seg.id)}
                          className={`text-xs md:text-xs font-semibold text-purple-600 bg-none border border-transparent rounded px-2 py-1.5 cursor-pointer ${isMobile ? 'min-h-9' : ''}`}
                          style={{ backgroundColor: editingSpeakerId === seg.id ? '#EDE9FE' : 'none' }}
                        >
                          {getSpeakerName(seg.speaker)} ▾
                        </button>
                        {editingSpeakerId === seg.id && allSpeakerLabels.length > 0 && (
                          <div className="absolute top-full left-0 bg-surface-0 border border-surface-3 rounded-lg shadow-lg z-40 min-w-36 overflow-hidden">
                            {allSpeakerLabels.map(label => (
                              <button
                                key={label}
                                onClick={() => reassignSpeaker(seg.id, label)}
                                className={`block w-full text-left px-3 py-2 text-sm border-none cursor-pointer ${isMobile ? 'min-h-11' : ''}`}
                                style={{ 
                                  backgroundColor: seg.speaker === label ? '#EDE9FE' : 'white',
                                  color: seg.speaker === label ? '#7C3AED' : '#374151',
                                  fontWeight: seg.speaker === label ? '600' : '400'
                                }}
                              >
                                {getSpeakerName(label)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-full md:min-w-auto">
                        {isEditing ? (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-text-secondary">說話者：</span>
                              <select
                                value={editingSpeaker}
                                onChange={e => setEditingSpeaker(e.target.value)}
                                className="border border-surface-3 rounded px-2 py-1 text-xs text-purple-600 font-semibold min-h-9"
                              >
                                {allSpeakerLabels.map(label => (
                                  <option key={label} value={label}>{getSpeakerName(label)}</option>
                                ))}
                              </select>
                            </div>
                            <textarea
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                              onBlur={() => handleEditSave(seg.id)}
                              autoFocus
                              className="w-full p-2 border border-surface-3 rounded text-sm leading-relaxed min-h-[100px] md:min-h-15"
                            />
                          </div>
                        ) : (
                          <div
                            onDoubleClick={() => handleEditStart(seg)}
                            className="text-sm leading-relaxed text-text-primary cursor-text py-1"
                            dangerouslySetInnerHTML={{ __html: highlightText(displayText) }}
                          />
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => handleEditStart(seg)}
                          className="text-text-secondary bg-none border-none cursor-pointer text-lg md:text-sm min-h-11 min-w-11 shrink-0"
                        >
                          
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-lg text-sm shadow-lg z-50 max-w-[90%] text-center">
          {toast}
        </div>
      )}

      {/* Replace Panel - 固定在底部工具列上方 */}
      {showReplace && segments.length > 0 && (
        <div className="fixed bottom-[70px] md:bottom-20 left-0 right-0 bg-surface-0 border-t-2 border-blue-600 shadow-lg z-25 p-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-text-primary"> 批量取代</h3>
              <button
                onClick={() => setShowReplace(false)}
                className="bg-none border-none text-xl cursor-pointer min-h-11 min-w-11 text-text-secondary"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="搜尋文字..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="w-full p-3 border border-surface-3 rounded-md text-sm min-h-11"
              />
              <input
                type="text"
                placeholder="替換為..."
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                className="w-full p-3 border border-surface-3 rounded-md text-sm min-h-11"
              />
              <div className="flex items-center gap-2 min-h-11">
                <input
                  type="checkbox"
                  id="addToDict"
                  checked={addToDict}
                  onChange={e => setAddToDict(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <label htmlFor="addToDict" className="text-sm text-text-primary cursor-pointer">
                  同時加入辭典
                </label>
              </div>
              <button
                onClick={handleReplace}
                disabled={replacing || !searchText}
                className="bg-blue-600 text-white p-3 rounded-md text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-12"
              >
                {replacing ? ' 取代中...' : '執行取代'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Toolbar - 固定底部 */}
      {segments.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface-0 border-t border-surface-3 shadow-md z-20">
          <div className="max-w-5xl mx-auto px-3 md:px-4 py-3">
            {!isMobile && (
              <div className="text-xs text-text-secondary mb-2.5">
                {segments.length} 個段落 · 點擊時間戳跳轉 · 雙擊文字編輯
              </div>
            )}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={handleCorrect}
                disabled={correcting}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 min-h-12 whitespace-nowrap shrink-0"
              >
                {correcting ? ' 校正中...' : ' 辭典校正'}
              </button>
              <button
                onClick={() => setShowReplace(!showReplace)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer min-h-12 whitespace-nowrap shrink-0 ${showReplace ? 'bg-blue-600 text-white' : 'bg-surface-2 text-text-primary'}`}
              >
                 批量取代
              </button>
              <button
                onClick={handlePolish}
                disabled={polishing}
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer min-h-12 whitespace-nowrap shrink-0 relative overflow-hidden"
                style={{ minWidth: polishing ? '180px' : 'auto', background: polishing ? '#9CA3AF' : 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)' }}
              >
                {polishing && (
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-purple-500 transition-all"
                    style={{ width: `${polishProgress}%` }}
                  />
                )}
                {polishing ? ` ${polishProgress}% ${polishMessage}` : ' AI 潤稿'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
