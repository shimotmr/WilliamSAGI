'use client';

import { useState } from 'react';
import {
  ArrowUpCircle, Eye, Clock, ShieldAlert, SkipForward,
  ChevronDown, ChevronUp, Activity, Wrench, Sparkles,
  Package, Globe, Star, AlertTriangle, CheckCircle2,
  TrendingUp, Filter,
} from 'lucide-react';

// --- Types ---
interface UpgradeTarget {
  id: number;
  name: string;
  category: 'model' | 'tool' | 'skill' | 'package' | 'api';
  subcategory: string;
  currentVersion: string;
  latestVersion: string;
  score: number;
  recommendation: string;
  negativeStatus: string;
  securityStatus: string;
  summary: string;
  costImpact?: string;
}

// --- Mock Data ---
const mockTargets: UpgradeTarget[] = [
  { id: 1, name: 'GLM-5.1', category: 'model', subcategory: '已部署', currentVersion: '5.0', latestVersion: '5.1', score: 8, recommendation: '立即升級', negativeStatus: 'none', securityStatus: 'clear', summary: '推理效能提升，token 消耗降低 15%', costImpact: '省成本' },
  { id: 2, name: 'OpenClaw', category: 'tool', subcategory: 'CLI', currentVersion: '1.2.0', latestVersion: '1.3.0-beta', score: 6, recommendation: '觀察等待', negativeStatus: 'minor', securityStatus: 'clear', summary: 'v1.3 beta 不穩定，等正式版' },
  { id: 3, name: 'MiniMax Skills', category: 'skill', subcategory: '技能庫', currentVersion: '初始版', latestVersion: '1.0', score: 9, recommendation: '立即升級', negativeStatus: 'none', securityStatus: 'clear', summary: '官方 15 個 skill，frontend/fullstack 可直接用' },
  { id: 4, name: '某套件', category: 'package', subcategory: 'Python', currentVersion: '2.1.0', latestVersion: '2.2.0', score: 3, recommendation: '安全疑慮', negativeStatus: 'critical', securityStatus: 'warning', summary: '供應鏈攻擊疑慮，社群警告勿升級' },
  { id: 5, name: 'supabase-py', category: 'package', subcategory: 'Python', currentVersion: '2.28.0', latestVersion: '2.30.0', score: 7, recommendation: '立即升級', negativeStatus: 'none', securityStatus: 'clear', summary: '效能改善，修復 connection pool 問題' },
];

// --- Constants ---
const categories = [
  { key: 'all', label: '全部', icon: Filter },
  { key: 'model', label: '模型', icon: Activity },
  { key: 'tool', label: '工具', icon: Wrench },
  { key: 'skill', label: 'Skills', icon: Sparkles },
  { key: 'package', label: '套件', icon: Package },
  { key: 'api', label: 'APIs', icon: Globe },
] as const;

const subcategoryMap: Record<string, string[]> = {
  model: ['已部署', '觀察中'],
  tool: ['CLI', 'Brew', 'Extensions'],
  skill: ['技能庫'],
  package: ['Python', 'npm'],
  api: ['REST', 'GraphQL'],
};

const badgeConfig: Record<string, { color: string; bg: string; icon: typeof ArrowUpCircle }> = {
  '立即升級': { color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: ArrowUpCircle },
  '觀察等待': { color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', icon: Eye },
  '等待OpenClaw支援': { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: Clock },
  '安全疑慮': { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: ShieldAlert },
  '跳過': { color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/20', icon: SkipForward },
};

// --- Components ---
function StatCard({ icon: Icon, label, value, color }: { icon: typeof Activity; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-lg font-semibold text-white">{value}</div>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 7 ? 'bg-green-400' : score >= 5 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-white/10">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-300">{score}/10</span>
    </div>
  );
}

function Badge({ recommendation }: { recommendation: string }) {
  const cfg = badgeConfig[recommendation] || badgeConfig['跳過'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {recommendation}
    </span>
  );
}

function TargetCard({ target }: { target: UpgradeTarget }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{target.name}</h3>
            <Badge recommendation={target.recommendation} />
            {target.securityStatus === 'warning' && (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
            <span>{target.currentVersion} → {target.latestVersion}</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5">{target.subcategory}</span>
          </div>
          <div className="mt-2">
            <ScoreBar score={target.score} />
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {open && (
        <div className="mt-3 border-t border-white/10 pt-3 text-sm text-gray-300">
          <p>{target.summary}</p>
          {target.costImpact && (
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <TrendingUp className="h-3 w-3" />
              {target.costImpact}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Page ---
export default function UpgradeTrackerPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const filtered = mockTargets.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (activeSubcategory && t.subcategory !== activeSubcategory) return false;
    return true;
  });

  const stats = {
    tracking: mockTargets.length,
    newVersions: mockTargets.filter(t => t.currentVersion !== t.latestVersion).length,
    recommended: mockTargets.filter(t => t.recommendation === '立即升級').length,
    security: mockTargets.filter(t => t.securityStatus === 'warning').length,
  };

  const subs = activeCategory !== 'all' ? (subcategoryMap[activeCategory] || []) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Upgrade Tracker</h1>
        <p className="text-sm text-gray-400">追蹤工具、模型與套件的升級狀態與評估</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Activity} label="追蹤中" value={stats.tracking} color="text-blue-400" />
        <StatCard icon={ArrowUpCircle} label="本週新版本" value={stats.newVersions} color="text-purple-400" />
        <StatCard icon={CheckCircle2} label="建議升級" value={stats.recommended} color="text-green-400" />
        <StatCard icon={ShieldAlert} label="安全警示" value={stats.security} color="text-red-400" />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setActiveSubcategory(null); }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-blue-400/40 bg-blue-400/10 text-blue-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Subcategory Tags */}
      {subs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subs.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                activeSubcategory === sub
                  ? 'border-white/30 bg-white/15 text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center text-sm text-gray-400">
            此分類暫無追蹤項目
          </div>
        ) : (
          filtered.map(t => <TargetCard key={t.id} target={t} />)
        )}
      </div>
    </div>
  );
}
