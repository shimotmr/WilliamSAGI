'use client'

import { useEffect, useState, useMemo, useCallback, Fragment } from 'react'
import { createClient } from '@/lib/supabase-client'

interface FlowRule {
  id: number
  form_code: string
  form_name: string
  category: string
  default_action: 'auto_approve' | 'human' | 'auto_reject'
  auto_approve_conditions: any
  auto_reject_conditions: any
  human_review_conditions: any
  human_reviewer: string | null
  rule_notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

const ACTION_COLORS: Record<string, string> = {
  auto_approve: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  human: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  auto_reject: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const ACTION_LABELS: Record<string, string> = {
  auto_approve: '自動通過',
  human: '人工審核',
  auto_reject: '自動駁回',
}

export default function FlowRulesPage() {
  const [rules, setRules] = useState<FlowRule[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('全部')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ default_action: '', human_reviewer: '', rule_notes: '' })
  const [saving, setSaving] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const fetchRules = useCallback(async () => {
    const { data, error } = await supabase
      .from('aurotek_form_rules')
      .select('*')
      .order('category')
      .order('id')
    if (!error && data) setRules(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchRules() }, [fetchRules])

  const categories = useMemo(() => {
    const cats = [...new Set(rules.map(r => r.category))].sort()
    return ['全部', ...cats]
  }, [rules])

  const filtered = useMemo(() => {
    let result = rules
    if (activeTab !== '全部') result = result.filter(r => r.category === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.form_code.toLowerCase().includes(q) || r.form_name.toLowerCase().includes(q)
      )
    }
    return result
  }, [rules, activeTab, search])

  const stats = useMemo(() => ({
    total: rules.length,
    autoApprove: rules.filter(r => r.default_action === 'auto_approve').length,
    human: rules.filter(r => r.default_action === 'human').length,
    autoReject: rules.filter(r => r.default_action === 'auto_reject').length,
  }), [rules])

  const startEdit = (rule: FlowRule) => {
    setEditingId(rule.id)
    setEditForm({
      default_action: rule.default_action,
      human_reviewer: rule.human_reviewer || '',
      rule_notes: rule.rule_notes || '',
    })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async () => {
    if (editingId === null) return
    setSaving(true)
    const { error } = await supabase
      .from('aurotek_form_rules')
      .update({
        default_action: editForm.default_action,
        human_reviewer: editForm.human_reviewer || null,
        rule_notes: editForm.rule_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId)
    if (!error) {
      setRules(prev => prev.map(r =>
        r.id === editingId
          ? { ...r, default_action: editForm.default_action as any, human_reviewer: editForm.human_reviewer || null, rule_notes: editForm.rule_notes || null }
          : r
      ))
      setEditingId(null)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-zinc-600 border-t-white rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Aurotek Flow 審核規則</h1>
          <p className="text-zinc-500 mt-1 text-sm">管理表單審核流程的自動化規則</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '總表單數', value: stats.total, color: 'text-zinc-100' },
            { label: '自動通過', value: stats.autoApprove, color: 'text-emerald-400' },
            { label: '人工審核', value: stats.human, color: 'text-amber-400' },
            { label: '自動駁回', value: stats.autoReject, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜尋表單代碼或名稱..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-80 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-6 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === cat
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat}
              <span className="ml-1.5 opacity-60">
                {cat === '全部' ? rules.length : rules.filter(r => r.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">表單代碼</th>
                  <th className="text-left px-4 py-3 font-medium">表單名稱</th>
                  <th className="text-left px-4 py-3 font-medium">預設動作</th>
                  <th className="text-left px-4 py-3 font-medium">審核人</th>
                  <th className="text-left px-4 py-3 font-medium">備註</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rule => (
                  <Fragment key={rule.id}>
                    <tr
                      onClick={() => editingId === rule.id ? cancelEdit() : startEdit(rule)}
                      className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
                        editingId === rule.id ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-zinc-600 font-mono text-xs">{rule.id}</td>
                      <td className="px-4 py-3">
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono border border-zinc-700">
                          {rule.form_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-200">{rule.form_name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${ACTION_COLORS[rule.default_action]}`}>
                          {ACTION_LABELS[rule.default_action] || rule.default_action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{rule.human_reviewer || '—'}</td>
                      <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">
                        {rule.rule_notes ? (rule.rule_notes.length > 50 ? rule.rule_notes.slice(0, 50) + '…' : rule.rule_notes) : '—'}
                      </td>
                    </tr>
                    {editingId === rule.id && (
                      <tr className="border-b border-zinc-800/50 bg-zinc-800/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-shrink-0">
                              <label className="block text-xs text-zinc-500 mb-1">預設動作</label>
                              <select
                                value={editForm.default_action}
                                onChange={e => setEditForm(f => ({ ...f, default_action: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                              >
                                <option value="auto_approve">自動通過</option>
                                <option value="human">人工審核</option>
                                <option value="auto_reject">自動駁回</option>
                              </select>
                            </div>
                            <div className="flex-shrink-0">
                              <label className="block text-xs text-zinc-500 mb-1">審核人</label>
                              <input
                                type="text"
                                value={editForm.human_reviewer}
                                onChange={e => setEditForm(f => ({ ...f, human_reviewer: e.target.value }))}
                                className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 w-40 focus:outline-none focus:border-zinc-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-zinc-500 mb-1">備註</label>
                              <textarea
                                value={editForm.rule_notes}
                                onChange={e => setEditForm(f => ({ ...f, rule_notes: e.target.value }))}
                                rows={2}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <button
                                onClick={e => { e.stopPropagation(); saveEdit() }}
                                disabled={saving}
                                className="px-4 py-2 bg-white text-zinc-900 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                              >
                                {saving ? '儲存中...' : '確定'}
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); cancelEdit() }}
                                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-md text-sm hover:bg-zinc-700 transition-colors border border-zinc-700"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-600">
                      {search ? '沒有符合搜尋條件的規則' : '尚無規則資料'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-zinc-600 text-right">
          顯示 {filtered.length} / {rules.length} 筆規則
        </div>
      </div>
    </div>
  )
}

