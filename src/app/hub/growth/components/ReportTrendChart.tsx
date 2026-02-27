'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface ReportTrendData {
  date: string
  research?: number
  review?: number
  design?: number
  analysis?: number
  report?: number
}

interface ReportTrendChartProps {
  data: ReportTrendData[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ReportTrendChart({ data }: ReportTrendChartProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            labelFormatter={(label) => `日期: ${label}`}
          />
          <Area 
            type="monotone" 
            dataKey="research" 
            stackId="1"
            stroke="#8b5cf6" 
            fill="#8b5cf6" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="review" 
            stackId="1"
            stroke="#06b6d4" 
            fill="#06b6d4" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="design" 
            stackId="1"
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="analysis" 
            stackId="1"
            stroke="#f59e0b" 
            fill="#f59e0b" 
            fillOpacity={0.6}
          />
          <Area 
            type="monotone" 
            dataKey="report" 
            stackId="1"
            stroke="#ef4444" 
            fill="#ef4444" 
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-foreground-muted">研究</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-foreground-muted">審查</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-foreground-muted">設計</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-foreground-muted">分析</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-foreground-muted">報告</span>
        </div>
      </div>
    </>
  )
}