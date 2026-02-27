// ============================================================
// RAG Testing Dashboard — Test Set Detail (Questions List)
// ============================================================
'use client'

import { 
  ArrowLeft, Plus, Search, FileText, Trash2, Edit2, 
  Loader2, Upload, X, CheckCircle, AlertCircle, Save,
  ChevronDown, ChevronUp, Filter
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'

interface Question {
  id: number
  test_set_id: number
  question: string
  expected_answer: string | null
  category: string | null
  difficulty: string | null
  created_at: string
  updated_at: string
}

interface TestSet {
  id: number
  name: string
  description: string | null
  question_count: number
  created_at: string
}

const CATEGORIES = ['產品資訊', '技術支援', '帳務問題', '一般諮詢', '投訴建議', '其他']
const DIFFICULTIES = ['簡單', '中等', '困難']

export default function TestSetDetailPage() {
  const params = useParams()
  const testSetId = params.id as string

  const [testSet, setTestSet] = useState<TestSet | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  
  // Add question modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newExpectedAnswer, setNewExpectedAnswer] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('')
  const [adding, setAdding] = useState(false)

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadFormat, setUploadFormat] = useState<'csv' | 'json'>('csv')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number } | null>(null)

  // Edit question modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editExpectedAnswer, setEditExpectedAnswer] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDifficulty, setEditDifficulty] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [tsRes, qRes] = await Promise.all([
        fetch(`/api/rag-testing/test-sets/${testSetId}`),
        fetch(`/api/rag-testing/test-sets/${testSetId}/questions`)
      ])
      
      const tsData = await tsRes.json()
      const qData = await qRes.json()
      
      if (tsData && !tsData.error) {
        setTestSet(tsData)
      }
      if (Array.isArray(qData)) {
        setQuestions(qData)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [testSetId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    setAdding(true)
    try {
      const res = await fetch(`/api/rag-testing/test-sets/${testSetId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          expected_answer: newExpectedAnswer || null,
          category: newCategory || null,
          difficulty: newDifficulty || null
        })
      })
      
      if (res.ok) {
        const created = await res.json()
        setQuestions(prev => [...prev, ...(Array.isArray(created) ? created : [created])])
        setShowAddModal(false)
        resetAddForm()
        // Refresh test set to update question count
        const tsRes = await fetch(`/api/rag-testing/test-sets/${testSetId}`)
        const tsData = await tsRes.json()
        if (tsData && !tsData.error) {
          setTestSet(tsData)
        }
      }
    } catch (err) {
      console.error('Failed to add question:', err)
    } finally {
      setAdding(false)
    }
  }

  const resetAddForm = () => {
    setNewQuestion('')
    setNewExpectedAnswer('')
    setNewCategory('')
    setNewDifficulty('')
  }

  const handleUpload = async () => {
    if (!uploadFile) return

    setUploading(true)
    setUploadResult(null)

    try {
      const text = await uploadFile.text()
      let parsed: Partial<Question>[] = []

      if (uploadFormat === 'json') {
        parsed = JSON.parse(text)
      } else {
        // CSV parsing
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',')
          const obj: Record<string, string> = {}
          headers.forEach((h, idx) => {
            obj[h] = values[idx]?.trim().replace(/^"|"$/g, '') || ''
          })
          parsed.push({
            question: obj.question || obj.q || '',
            expected_answer: obj.expected_answer || obj.answer || obj.expectedanswer || null,
            category: obj.category || obj.cat || null,
            difficulty: obj.difficulty || obj.diff || null
          })
        }
      }

      // Filter out invalid entries
      const valid = parsed.filter(p => p.question && p.question.trim())
      
      if (valid.length > 0) {
        const res = await fetch(`/api/rag-testing/test-sets/${testSetId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(valid)
        })

        if (res.ok) {
          const created = await res.json()
          setQuestions(prev => [...prev, ...(Array.isArray(created) ? created : [created])])
          setUploadResult({ success: valid.length, failed: parsed.length - valid.length })
          
          // Refresh test set
          const tsRes = await fetch(`/api/rag-testing/test-sets/${testSetId}`)
          const tsData = await tsRes.json()
          if (tsData && !tsData.error) {
            setTestSet(tsData)
          }
        }
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('上傳失敗，請檢查檔案格式')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuestion) return

    setSaving(true)
    try {
      const res = await fetch(`/api/rag-testing/test-sets/${testSetId}/questions/${editingQuestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: editQuestion,
          expected_answer: editExpectedAnswer || null,
          category: editCategory || null,
          difficulty: editDifficulty || null
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setQuestions(prev => prev.map(q => 
          q.id === editingQuestion.id 
            ? { ...q, question: updated.question, expected_answer: updated.expected_answer, category: updated.category, difficulty: updated.difficulty }
            : q
        ))
        setEditingQuestion(null)
      }
    } catch (err) {
      console.error('Failed to update question:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/rag-testing/test-sets/${testSetId}/questions/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id))
        // Update count
        if (testSet) {
          setTestSet({ ...testSet, question_count: testSet.question_count - 1 })
        }
      }
    } catch (err) {
      console.error('Failed to delete question:', err)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filteredQuestions = questions.filter(q => {
    const matchSearch = !search || 
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      (q.expected_answer && q.expected_answer.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = !categoryFilter || q.category === categoryFilter
    const matchDifficulty = !difficultyFilter || q.difficulty === difficultyFilter
    return matchSearch && matchCategory && matchDifficulty
  })

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case '簡單': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case '中等': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case '困難': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <Link href="/rag-testing" className="text-foreground-muted text-sm hover:text-foreground transition mb-3 inline-flex items-center gap-1.5">
            <ArrowLeft size={14} />
            RAG Testing
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {testSet?.name || '載入中...'}
                </h1>
                {testSet?.description && (
                  <p className="text-xs text-foreground-muted mt-0.5">{testSet.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:border-gray-600 transition text-sm"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">批次上傳</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition"
              >
                <Plus size={16} />
                新增題目
              </button>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="搜尋題目..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="">全部分類</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="">全部難度</option>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-foreground-muted" />
          </div>
        )}

        {/* Questions List */}
        {!loading && (
          <div className="space-y-3">
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="group rounded-xl border border-border bg-card p-4 hover:border-orange-500/20 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {q.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {q.category}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground mb-2">{q.question}</p>
                    {q.expected_answer && (
                      <div className="text-sm text-foreground-muted bg-muted/30 rounded-lg p-2">
                        <span className="text-xs text-foreground-subtle block mb-0.5">預期答案：</span>
                        {q.expected_answer}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditingQuestion(q)
                        setEditQuestion(q.question)
                        setEditExpectedAnswer(q.expected_answer || '')
                        setEditCategory(q.category || '')
                        setEditDifficulty(q.difficulty || '')
                      }}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition"
                      title="編輯"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(q.id)}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-400/10 transition"
                      title="刪除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 text-foreground-muted">
                <FileText size={32} className="mx-auto mb-3 opacity-50" />
                <p>尚無題目</p>
                <p className="text-sm mt-1">點擊上方「新增題目」或「批次上傳」開始</p>
              </div>
            )}
          </div>
        )}

        {/* Add Question Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">新增題目</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleAddQuestion}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                    問題 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="輸入問題內容..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                    autoFocus
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                    預期答案
                  </label>
                  <textarea
                    value={newExpectedAnswer}
                    onChange={(e) => setNewExpectedAnswer(e.target.value)}
                    placeholder="選填：預期的回答內容..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                      分類
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    >
                      <option value="">選擇分類</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                      難度
                    </label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => setNewDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    >
                      <option value="">選擇難度</option>
                      {DIFFICULTIES.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground-muted hover:bg-accent transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={adding || !newQuestion.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition disabled:opacity-50"
                  >
                    {adding ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        新增中...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        新增
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setShowUploadModal(false); setUploadResult(null) }}
            />
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">批次上傳題目</h2>
                <button
                  onClick={() => { setShowUploadModal(false); setUploadResult(null) }}
                  className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition"
                >
                  <X size={18} />
                </button>
              </div>

              {uploadResult ? (
                <div className="text-center py-4">
                  <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
                  <p className="text-foreground font-medium">上傳完成</p>
                  <p className="text-sm text-foreground-muted mt-1">
                    成功新增 {uploadResult.success} 題
                    {uploadResult.failed > 0 && `，${uploadResult.failed} 筆失敗`}
                  </p>
                  <button
                    onClick={() => { setUploadResult(null); setUploadFile(null) }}
                    className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition"
                  >
                    繼續上傳
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                      檔案格式
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setUploadFormat('csv')}
                        className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          uploadFormat === 'csv' 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border text-foreground-muted hover:border-gray-600'
                        }`}
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => setUploadFormat('json')}
                        className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                          uploadFormat === 'json' 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border text-foreground-muted hover:border-gray-600'
                        }`}
                      >
                        JSON
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                      選擇檔案
                    </label>
                    <input
                      type="file"
                      accept={uploadFormat === 'csv' ? '.csv' : '.json'}
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium hover:file:bg-primary-hover transition"
                    />
                  </div>

                  <div className="mb-5 p-3 rounded-lg bg-muted/30 text-xs text-foreground-muted">
                    <p className="font-medium text-foreground-subtle mb-1">CSV 格式範例：</p>
                    <code className="block whitespace-pre">{`question,expected_answer,category,difficulty
"什麼是產品特色？","產品特色是...",產品資訊,簡單
"如何聯繫客服？","請撥打...",技術支援,中等`}</code>
                    <p className="font-medium text-foreground-subtle mt-2 mb-1">JSON 格式範例：</p>
                    <code className="block whitespace-pre">{`[
  {"question": "...", "expected_answer": "...", "category": "...", "difficulty": "..."}
]`}</code>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowUploadModal(false); setUploadResult(null) }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground-muted hover:bg-accent transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !uploadFile}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          上傳中...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          上傳
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setEditingQuestion(null)}
            />
            <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-foreground">編輯題目</h2>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-1 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleEdit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                    問題 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                    預期答案
                  </label>
                  <textarea
                    value={editExpectedAnswer}
                    onChange={(e) => setEditExpectedAnswer(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                      分類
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    >
                      <option value="">選擇分類</option>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-1.5">
                      難度
                    </label>
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                    >
                      <option value="">選擇難度</option>
                      {DIFFICULTIES.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingQuestion(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground-muted hover:bg-accent transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !editQuestion.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        儲存中...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        儲存
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
                確定要刪除這題嗎？
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
