// ============================================================
// RAG Testing Dashboard — Test Sets List
// ============================================================
'use client'

import { 
  ArrowLeft, Plus, Search, FileText, Trash2, 
  Loader2, Upload, X, CheckCircle, AlertCircle 
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

interface TestSet {
  id: number
  name: string
  description: string | null
  question_count: number
  created_at: string
  updated_at: string
}

export default function RAGTestingPage() {
  const [testSets, setTestSets] = useState<TestSet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const fetchTestSets = useCallback(async () => {
    try {
      const res = await fetch('/api/rag-testing/test-sets')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTestSets(data)
      }
    } catch (err) {
      console.error('Failed to fetch test sets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTestSets()
  }, [fetchTestSets])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/rag-testing/test-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc || null })
      })
      
      if (res.ok) {
        const created = await res.json()
        setTestSets(prev => [created, ...prev])
        setShowCreateModal(false)
        setNewName('')
        setNewDesc('')
      }
    } catch (err) {
      console.error('Failed to create test set:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/rag-testing/test-sets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTestSets(prev => prev.filter(ts => ts.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete test set:', err)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filteredTestSets = testSets.filter(ts => 
    ts.name.toLowerCase().includes(search.toLowerCase()) ||
    (ts.description && ts.description.toLowerCase().includes(search.toLowerCase()))
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-foreground-muted text-sm hover:text-foreground transition mb-3 inline-flex items-center gap-1.5">
            <ArrowLeft size={14} />
            William Hub
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">RAG Testing</h1>
                <p className="text-xs text-foreground-muted mt-0.5">測試題庫管理</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition"
            >
              <Plus size={16} />
              新增測試集
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="搜尋測試集..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-foreground-muted" />
          </div>
        )}

        {/* Test Sets Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTestSets.map((ts) => (
              <div
                key={ts.id}
                className="group relative rounded-xl border border-border bg-card p-5 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all duration-200"
              >
                <Link href={`/rag-testing/${ts.id}`} className="block">
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-orange-400 transition">
                    {ts.name}
                  </h3>
                  {ts.description && (
                    <p className="text-sm text-foreground-muted mb-3 line-clamp-2">
                      {ts.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-foreground-subtle">
                    <span className="flex items-center gap-1">
                      <FileText size={12} />
                      {ts.question_count} 題
                    </span>
                    <span>{formatDate(ts.updated_at)}</span>
                  </div>
                </Link>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDeleteConfirm(ts.id)
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="刪除測試集"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {filteredTestSets.length === 0 && (
              <div className="col-span-full text-center py-12 text-foreground-muted">
                <FileText size={32} className="mx-auto mb-3 opacity-50" />
                <p>尚無測試集</p>
                <p className="text-sm mt-1">點擊上方「新增測試集」開始</p>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">新增測試集</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                    名稱 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例如：產品問答測試"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="mb-5">
                  <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                    描述
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="選填：描述這個測試集的用途..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground-muted hover:bg-accent transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        建立中...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        建立
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={20} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">確認刪除</h2>
                  <p className="text-sm text-foreground-muted">此操作無法復原</p>
                </div>
              </div>
              
              <p className="text-sm text-foreground-muted mb-5">
                確定要刪除這個測試集嗎？包含的所有題目也會一併被刪除。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground-muted hover:bg-accent transition"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition"
                >
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
