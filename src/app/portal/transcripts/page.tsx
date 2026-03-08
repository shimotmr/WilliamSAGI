'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

import { supabase } from '@/lib/supabase'

interface Transcript {
  id: string
  title: string | null
  meeting_date: string | null
  duration_seconds: number | null
  status: string
  speakers: Record<string, string> | null
  assemblyai_id: string | null
  created_at: string
}

// 狀態映射 - 使用 CSS 變數
const STATUS_MAP: Record<string, { label: string; className: string }> = {
  uploading: { label: '上傳中', className: 'status-uploading' },
  processing: { label: '轉錄中', className: 'status-processing' },
  ready: { label: '已完成', className: 'status-ready' },
  reviewed: { label: '已校閱', className: 'status-reviewed' },
  error: { label: '錯誤', className: 'status-error' },
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)

  const loadTranscripts = useCallback(async () => {
    const { data } = await supabase
      .from('transcripts')
      .select('id, title, meeting_date, duration_seconds, status, speakers, assemblyai_id, created_at')
      .order('created_at', { ascending: false })
    setTranscripts(data || [])
    setLoading(false)
  }, [])

  // 根據已耗時時間估算進度（一般轉錄約為音頻時長的 30-60%）
  const getProgress = (t: Transcript) => {
    if (t.status !== 'processing' && t.status !== 'uploading') return 100
    const elapsed = (Date.now() - new Date(t.created_at).getTime()) / 1000
    // 假設平均轉錄約 3 分鐘；對數曲線，最高 95%
    const progress = Math.min(95, Math.round((1 - Math.exp(-elapsed / 120)) * 100))
    return Math.max(5, progress)
  }

  // 輪詢處理中的逐字稿
  const pollProgress = useCallback(async () => {
    const processing = transcripts.filter(t => t.status === 'processing' || t.status === 'uploading')
    if (processing.length === 0) return

    for (const t of processing) {
      if (!t.assemblyai_id) continue
      try {
        const res = await fetch(`/api/transcripts/${t.id}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ready' || data.status === 'error') {
            loadTranscripts()
            return
          }
        }
      } catch {}
    }
  }, [transcripts, loadTranscripts])

  useEffect(() => {
    loadTranscripts()
  }, [loadTranscripts])

  // 自動刷新進度顯示 + 輪詢狀態
  const [, setTick] = useState(0)
  useEffect(() => {
    const hasProcessing = transcripts.some(t => t.status === 'processing' || t.status === 'uploading')
    if (!hasProcessing) return

    // 每 3 秒更新顯示，每 10 秒輪詢 API
    let pollCount = 0
    const interval = setInterval(() => {
      setTick(t => t + 1) // 強制重新渲染以更新基於時間的進度
      pollCount++
      if (pollCount % 3 === 0) pollProgress() // 每約 10 秒輪詢一次
    }, 3000)
    return () => clearInterval(interval)
  }, [transcripts, pollProgress])

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (d: string | null) => {
    if (!d) return '未設定'
    const date = new Date(d)
    return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`
  }

  const getSpeakerCount = (speakers: Record<string, string> | null) => {
    return speakers ? Object.keys(speakers).length : 0
  }

  return (
    <div className="transcripts-page">
      {/* 頁面標題 */}
      <header className="transcripts-header">
        <div className="header-content">
          <div className="header-icon-wrapper">
            <svg viewBox="0 0 20 20" fill="currentColor" className="header-icon-svg">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="header-title">會議逐字稿</h1>
        </div>
        <Link href="/transcripts/new" className="btn-add">
          <svg viewBox="0 0 20 20" fill="currentColor" className="btn-add-icon">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          新增
        </Link>
      </header>

      <div className="transcripts-container">
        {/* 載入中狀態 */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>載入中...</p>
          </div>
        ) : transcripts.length === 0 ? (
          // 空狀態
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h2 className="empty-title">尚無逐字稿</h2>
            <p className="empty-description">上傳會議錄音，即可開始建立逐字稿</p>
            <Link href="/transcripts/new" className="btn-primary empty-cta">
              建立第一個逐字稿
            </Link>
          </div>
        ) : (
          // 逐字稿列表
          <div className="transcripts-list">
            {transcripts.map(t => {
              const st = STATUS_MAP[t.status] || STATUS_MAP.ready
              const isProcessing = t.status === 'processing' || t.status === 'uploading'
              const progress = isProcessing ? getProgress(t) : 100

              return (
                <Link
                  key={t.id}
                  href={`/transcripts/${t.id}`}
                  className="transcript-card"
                >
                  {/* 處理中項目的進度條 */}
                  {isProcessing && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <div className="transcript-content">
                    <div className="transcript-main">
                      <h3 className="transcript-title">
                        {t.title || `逐字稿 ${String(t.id).slice(0, 8)}`}
                      </h3>
                      <span className={`status-badge ${st.className}`}>
                        {isProcessing ? `${st.label} ${progress}%` : st.label}
                      </span>
                    </div>
                    
                    <div className="transcript-meta">
                      <div className="transcript-info">
                        {(t.status === 'ready' || t.status === 'reviewed') ? (
                          <>
                            <span className="meta-item">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="meta-icon">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                              </svg>
                              {getSpeakerCount(t.speakers)} 位說話者
                            </span>
                            <span className="meta-divider">·</span>
                          </>
                        ) : null}
                        <span className="meta-item">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="meta-icon">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                          </svg>
                          {formatDate(t.meeting_date)}
                        </span>
                      </div>
                      <div className="transcript-duration">
                        <svg viewBox="0 0 20 20" fill="currentColor" className="duration-icon">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        {formatDuration(t.duration_seconds)}
                      </div>
                    </div>
                  </div>

                  <div className="transcript-arrow">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 內嵌樣式 */}
      <style jsx>{`
        /* ================================
           頁面佈局
           ================================ */
        .transcripts-page {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--surface-0) 0%, var(--surface-1) 100%);
          padding-bottom: 24px;
        }

        /* ================================
           頁面標題區域
           ================================ */
        .transcripts-header {
          background: var(--surface-0);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--surface-3);
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-purple-500), var(--accent-pink-500));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .header-icon-svg {
          width: 20px;
          height: 20px;
        }

        .header-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
        }

        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
        }

        .btn-add-icon {
          width: 16px;
          height: 16px;
        }

        /* ================================
           主要內容容器
           ================================ */
        .transcripts-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
        }

        /* ================================
           載入中狀態
           ================================ */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 0;
          color: var(--text-tertiary);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--surface-3);
          border-top-color: var(--primary-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ================================
           空狀態
           ================================ */
        .empty-state {
          text-align: center;
          padding: 64px 24px;
          background: var(--surface-1);
          border-radius: 20px;
          border: 2px dashed var(--surface-3);
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          line-height: 1;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .empty-description {
          color: var(--text-secondary);
          margin: 0 0 24px 0;
        }

        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
        }

        .empty-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
        }

        /* ================================
           逐字稿列表
           ================================ */
        .transcripts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ================================
           逐字稿卡片
           ================================ */
        .transcript-card {
          display: flex;
          align-items: center;
          background: var(--surface-1);
          border-radius: 16px;
          border: 1px solid var(--surface-3);
          padding: 20px;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .transcript-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: var(--primary-300);
        }

        [data-theme="dark"] .transcript-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        }

        /* 進度條 */
        .progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--surface-3);
          border-radius: 16px 16px 0 0;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-blue-500), var(--accent-purple-500));
          border-radius: 0 2px 2px 0;
          transition: width 1s ease-in-out;
        }

        .transcript-content {
          flex: 1;
          min-width: 0;
        }

        .transcript-main {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .transcript-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 狀態標籤 */
        .status-badge {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-uploading {
          background: var(--accent-yellow-500);
          background: rgba(234, 179, 8, 0.15);
          color: var(--accent-yellow-500);
        }

        .status-processing {
          background: var(--accent-blue-500);
          background: rgba(14, 165, 233, 0.15);
          color: var(--accent-blue-500);
        }

        .status-ready {
          background: var(--status-success);
          background: rgba(34, 197, 94, 0.15);
          color: var(--status-success);
        }

        .status-reviewed {
          background: var(--accent-purple-500);
          background: rgba(139, 92, 246, 0.15);
          color: var(--accent-purple-500);
        }

        .status-error {
          background: var(--status-error);
          background: rgba(239, 68, 68, 0.15);
          color: var(--status-error);
        }

        /* 中繼資訊 */
        .transcript-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .transcript-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .meta-icon {
          width: 14px;
          height: 14px;
          color: var(--text-tertiary);
        }

        .meta-divider {
          color: var(--text-tertiary);
        }

        .transcript-duration {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary-500);
          background: var(--primary-50);
          padding: 4px 10px;
          border-radius: 8px;
        }

        [data-theme="dark"] .transcript-duration {
          background: var(--primary-900);
          color: var(--primary-400);
        }

        .duration-icon {
          width: 14px;
          height: 14px;
        }

        /* 箭頭圖示 */
        .transcript-arrow {
          width: 24px;
          height: 24px;
          color: var(--text-tertiary);
          margin-left: 16px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .transcript-arrow svg {
          width: 100%;
          height: 100%;
        }

        .transcript-card:hover .transcript-arrow {
          transform: translateX(4px);
          color: var(--primary-500);
        }

        /* ================================
           響應式設計
           ================================ */
        @media (max-width: 768px) {
          .transcripts-header {
            padding: 12px 16px;
          }

          .header-title {
            font-size: 1rem;
          }

          .btn-add {
            padding: 8px 16px;
            font-size: 0.8125rem;
          }

          .transcripts-container {
            padding: 16px;
          }

          .empty-state {
            padding: 48px 16px;
          }

          .empty-icon {
            font-size: 48px;
          }

          .transcript-card {
            padding: 16px;
            flex-direction: column;
            align-items: flex-start;
          }

          .transcript-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .transcript-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            width: 100%;
          }

          .transcript-info {
            flex-wrap: wrap;
          }

          .transcript-duration {
            align-self: flex-start;
          }

          .transcript-arrow {
            display: none;
          }
        }

        /* ================================
           深色模式適配
           ================================ */
        [data-theme="dark"] .transcripts-page {
          background: linear-gradient(180deg, var(--surface-0) 0%, var(--surface-1) 100%);
        }

        [data-theme="dark"] .transcripts-header {
          background: rgba(15, 23, 42, 0.9);
        }

        [data-theme="dark"] .empty-state {
          background: var(--surface-1);
          border-color: var(--surface-3);
        }

        [data-theme="dark"] .transcript-card {
          background: var(--surface-1);
        }

        [data-theme="dark"] .progress-bar {
          background: var(--surface-2);
        }
      `}</style>
    </div>
  )
}
