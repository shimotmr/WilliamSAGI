'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface BalanceData {
  agent: string
  allocation: number
  usage: number
  efficiency: number
}

interface BalanceChartProps {
  data: BalanceData[]
}

export default function BalanceChart({ data }: BalanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-sm text-foreground-muted">
            配額: <span className="text-blue-400 font-medium">{data.allocation}%</span>
          </p>
          <p className="text-sm text-foreground-muted">
            使用: <span className="text-yellow-400 font-medium">{data.usage}%</span>
          </p>
          <p className="text-sm text-foreground-muted">
            效率: <span className="text-emerald-400 font-medium">{data.efficiency}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="agent" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{
            paddingTop: '10px',
            fontSize: '12px'
          }}
        />
        <Bar 
          dataKey="allocation" 
          fill="#3b82f6" 
          name="配額"
          radius={[2, 2, 0, 0]}
        />
        <Bar 
          dataKey="usage" 
          fill="#eab308" 
          name="使用量"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}