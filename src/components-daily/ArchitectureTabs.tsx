'use client'

import { Cpu, Shield, Globe, ChevronDown, Download, Server, Search, FileText, Pen, Compass, RefreshCw, Brain, Inbox, ShieldCheck, FileKey, Lock, Eye, Database, Workflow, Mail, Smartphone } from 'lucide-react'
import mermaid from 'mermaid'
import { useState, useEffect, useRef, useCallback } from 'react'

const tabs = [
  {
    id: 'skills',
    label: 'Skills 調用',
    icon: Cpu,
    title: 'Skills 調用邏輯架構',
    description: '使用者訊息經過 Gateway → Session → Agent 後，先進行複雜度判斷：簡單問答直接回覆，複雜任務則經 Request Orchestrator 拆解、Prompt Engineering Expert 結構化改寫，再由 Skill Router 分派至對應技能執行。',
    details: [
      { title: 'OpenClaw Gateway', icon: Server, desc: '接收來自 Telegram 的訊息，管理 session 與認證' },
      { title: '複雜度判斷', icon: Search, desc: '判斷請求為簡單問答（直接回覆）或複雜任務（進入 Orchestrator 流程）' },
      { title: 'Request Orchestrator', icon: FileText, desc: '將口語化請求轉譯為結構化任務，拆解子任務清單並調度技能' },
      { title: 'Prompt Engineering Expert', icon: Pen, desc: '對拆解後的任務進行結構化改寫，提升技能調用的精準度' },
      { title: 'Skill Router', icon: Compass, desc: '根據意圖分類結果，匹配最適合的技能組合（研究、開發、工作、金融、通訊）' },
      { title: 'Sub-Agent 派遣', icon: RefreshCw, desc: '複雜任務 spawn 獨立子代理，平行處理後回報主代理' },
      { title: '記憶系統', icon: Brain, desc: '每日紀錄（短期）+ MEMORY.md（長期）+ qmd 語義搜尋（RAG）' },
    ],
    diagram: `graph TD
    User["William / Telegram"] --> Gateway["OpenClaw Gateway"]
    Gateway --> Session["Session Manager"]
    Session --> Agent["Travis / Claude Opus 4.6"]
    Agent --> Judge{"複雜度判斷"}
    Judge -->|簡單問答| DirectReply["直接回覆"]
    Judge -->|複雜任務| Orchestrator["Request Orchestrator\n請求轉譯・任務拆解"]
    Orchestrator --> PromptExpert["Prompt Engineering Expert\n結構化改寫"]
    PromptExpert --> Router["Skill Router\n意圖分類・技能匹配"]
    Router --> Research["研究類\ntavily, perplexity, deep-research"]
    Router --> Coding["開發類\ngithub, nextjs, react"]
    Router --> Work["工作類\ngog, excel, zimbra"]
    Router --> Finance["金融類\nyahoo-finance, stock-analysis"]
    Router --> Communication["通訊類\ntelegram, LINE, WeCom"]
    Router --> SubAgent["Sub-Agent 派遣\n獨立任務並行處理"]
    Agent --> Memory["記憶系統"]
    Memory --> Daily["每日紀錄"]
    Memory --> Long["長期記憶 MEMORY.md"]
    Memory --> QMD["qmd 語義搜尋"]
    SubAgent --> Agent`,
  },
  {
    id: 'security',
    label: '安全防護',
    icon: Shield,
    title: '安全性處理架構',
    description: '多層安全架構：從輸入過濾、認證、執行沙箱到記憶防篡改，確保系統安全運行。',
    details: [
      { title: 'Prompt Injection 防護', icon: ShieldCheck, desc: '偵測「忽略指令」等惡意注入，Content Sanitization 過濾外部內容' },
      { title: '三層認證', icon: Lock, desc: 'Anthropic OAuth Token → Gateway Auth Token → Telegram Pairing' },
      { title: '執行沙箱', icon: Cpu, desc: 'Allowlist 模式限制可執行命令，Sandbox Isolation 隔離執行環境' },
      { title: '記憶安全', icon: Brain, desc: 'Poisoning Prevention + File Integrity Check 防止記憶篡改' },
      { title: '外部 API 安全', icon: Globe, desc: 'Google OAuth Scoping + Zimbra API Isolation 最小權限存取' },
      { title: '監控', icon: Eye, desc: 'Daily Security Digest + ClawHub Skill Audit 持續監控' },
    ],
    diagram: `graph TD
    Inbound["Inbound Messages"] --> PIDetect["Prompt Injection Detection"]
    PIDetect --> Sanitize["Content Sanitization"]
    Sanitize --> Agent["Agent Processing"]

    Auth["Authentication Layer"]
    Auth --> Anthropic["Anthropic OAuth Token"]
    Auth --> GW["Gateway Auth Token"]
    Auth --> TG["Telegram Pairing"]

    Exec["Execution Security"]
    Exec --> Allowlist["Allowlist Mode"]
    Exec --> Sandbox["Sandbox Isolation"]

    MemSec["Memory Security"]
    MemSec --> Poison["Poisoning Prevention"]
    MemSec --> Integrity["File Integrity Check"]

    External["External API Security"]
    External --> Google["Google OAuth Scoping"]
    External --> Zimbra["Zimbra API Isolation"]

    Monitor["Monitoring"]
    Monitor --> Digest["Daily Security Digest"]
    Monitor --> Audit["ClawHub Skill Audit"]`,
  },
  {
    id: 'webdev',
    label: '開發生態',
    icon: Globe,
    title: '系統全覽架構',
    description: '完整的系統架構——Mac mini 為核心，OpenClaw Gateway 管理多 Agent，連結 Supabase、Vercel 網站、LINE Bot、Telegram，以及 Zimbra 郵件資料流。',
    details: [
      { title: 'Mac mini (Travis AI)', icon: Server, desc: 'OpenClaw Gateway 主機，運行 Scripts、Cron Jobs，所有 Agent 的執行環境' },
      { title: 'OpenClaw Gateway', icon: Workflow, desc: '管理多 Agent 派遣：Travis（主）、Blake（開發）、Rex（研究）、Oscar（行政）、Warren（交易）、Griffin（監控）' },
      { title: 'Supabase', icon: Database, desc: 'PostgreSQL 資料庫，儲存 Portal 業績、看板任務、使用者資料' },
      { title: 'Travis Daily + William Hub', icon: Globe, desc: '兩個 Next.js 網站，部署於 Vercel，透過 GitHub 自動 CI/CD' },
      { title: 'LINE Bot + Telegram', icon: Smartphone, desc: 'LINE：業績通知推送；Telegram：Travis AI 主要對話介面' },
      { title: 'Zimbra → Supabase 資料流', icon: Mail, desc: 'Zimbra 郵件 → Scripts 解析 → Supabase 儲存 → Portal 呈現' },
    ],
    diagram: `graph TD
    subgraph MacMini["Mac mini — Travis AI"]
      Gateway["OpenClaw Gateway"]
      Scripts["Scripts + Cron Jobs"]
      Gateway --> Travis_Agent["Travis\nMain Agent"]
      Gateway --> Blake["Blake\nBuilder"]
      Gateway --> Rex["Rex\nThinker"]
      Gateway --> Oscar["Oscar\nOperator"]
      Gateway --> Warren["Warren\nTrader"]
      Gateway --> Griffin["Griffin\nGuardian"]
    end

    subgraph Cloud["Cloud Services"]
      Supabase[("Supabase\nPostgreSQL")]
      Vercel["Vercel\nHosting"]
      GitHub["GitHub\nshimotmr"]
    end

    subgraph Sites["Websites"]
      TravisDaily["Travis Daily\nAI 專欄"]
      WilliamHub["William Hub\nPersonal Portal"]
      Portal["Aurotek Portal\nSales Dashboard"]
    end

    subgraph Messaging["Messaging"]
      Telegram["Telegram\nAI 對話介面"]
      LINE["LINE Bot\n業績通知"]
    end

    subgraph Internal["Aurotek Internal"]
      Zimbra["Zimbra\nEmail + Calendar"]
      Google["Google APIs\nCalendar, Docs, Drive"]
    end

    Gateway --> Telegram
    Gateway --> LINE
    Travis_Agent --> Supabase
    Scripts --> Supabase
    GitHub --> Vercel
    Vercel --> TravisDaily
    Vercel --> WilliamHub
    Vercel --> Portal
    Portal --> Supabase
    Scripts --> Zimbra
    Scripts --> Google
    Zimbra -->|"郵件解析"| Scripts
    Scripts -->|"資料寫入"| Supabase
    Supabase -->|"業績資料"| Portal`,
  },
]

function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#6366f1',
        primaryTextColor: '#e2e8f0',
        primaryBorderColor: '#6366f1',
        lineColor: '#475569',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '13px',
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 12,
        nodeSpacing: 30,
        rankSpacing: 40,
      },
    })

    const render = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart)
        setSvg(svg)
      } catch (e) {
        console.error('Mermaid render error:', e)
      }
    }
    render()
  }, [chart, id])

  return (
    <div
      ref={ref}
      className="w-full overflow-x-auto rounded-xl bg-[#0a0a1a] border border-border p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

async function saveAsImage(containerId: string, title: string) {
  const html2canvas = (await import('html2canvas')).default
  const el = document.getElementById(containerId)
  if (!el) return

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;background:#0a0a1a;padding:32px;min-width:800px;'

  const titleEl = document.createElement('div')
  titleEl.style.cssText = 'font-size:24px;font-weight:bold;color:#e2e8f0;margin-bottom:20px;font-family:Inter,system-ui,sans-serif;text-align:center;'
  titleEl.textContent = title
  wrapper.appendChild(titleEl)

  const clone = el.cloneNode(true) as HTMLElement
  clone.style.overflow = 'visible'
  wrapper.appendChild(clone)

  const watermark = document.createElement('div')
  watermark.style.cssText = 'text-align:center;color:#64748b;font-size:14px;margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;font-family:Inter,system-ui,sans-serif;'
  watermark.textContent = 'Travis Research Lab by William Hsiao'
  wrapper.appendChild(watermark)

  document.body.appendChild(wrapper)

  try {
    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#0a0a1a',
      scale: 2,
      useCORS: true,
    })
    const link = document.createElement('a')
    link.download = `travis-architecture-${title}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } finally {
    document.body.removeChild(wrapper)
  }
}

export function ArchitectureTabs() {
  const [active, setActive] = useState('skills')
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const current = tabs.find(t => t.id === active)!

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await saveAsImage(`diagram-${current.id}`, current.title)
    } finally {
      setSaving(false)
    }
  }, [current])

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActive(tab.id); setExpandedDetail(null) }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden">
        {/* Description + Save button */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <current.icon size={20} className="text-primary" />
              <h2 className="font-bold text-lg">{current.title}</h2>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {saving ? '儲存中...' : 'Save as Image'}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>

        {/* Diagram */}
        <div className="p-4" id={`diagram-${current.id}`}>
          <MermaidDiagram chart={current.diagram} id={current.id} />
        </div>

        {/* Credit */}
        <div className="text-center text-xs text-muted-foreground pb-3">
          Travis Research Lab by William Hsiao
        </div>

        {/* Component details */}
        <div className="border-t border-border">
          <div className="p-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Components
            </h3>
          </div>
          <div className="px-4 pb-4 space-y-1">
            {current.details.map(d => {
              const isOpen = expandedDetail === d.title
              const Icon = d.icon
              return (
                <button
                  key={d.title}
                  onClick={() => setExpandedDetail(isOpen ? null : d.title)}
                  className="w-full text-left rounded-xl border border-border hover:bg-accent/30 transition-colors overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-primary/70" />
                      <span className="font-medium text-sm">{d.title}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-0 text-sm text-muted-foreground ml-7">
                      {d.desc}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
