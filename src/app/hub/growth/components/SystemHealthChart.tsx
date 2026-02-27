'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface HealthData {
  time: string
  uptime: number
  performance: number
  balance: number
}

interface SystemHealthChartProps {
  data: HealthData[]
}

export default function SystemHealthChart({ data }: SystemHealthChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">時間: {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-foreground-muted">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis 
          dataKey="time" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          domain={[90, 100]}
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
        <Line 
          type="monotone" 
          dataKey="uptime" 
          stroke="#22c55e" 
          strokeWidth={2}
          name="正常運行率"
          dot={{ fill: '#22c55e', r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="performance" 
          stroke="#3b82f6" 
          strokeWidth={2}
          name="性能指數"
          dot={{ fill: '#3b82f6', r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="balance" 
          stroke="#eab308" 
          strokeWidth={2}
          name="負載平衡"
          dot={{ fill: '#eab308', r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}