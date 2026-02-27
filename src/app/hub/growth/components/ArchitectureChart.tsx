'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface ArchitectureData {
  component: string
  files: number
  vectors: number
}

interface ArchitectureChartProps {
  data: ArchitectureData[]
}

export default function ArchitectureChart({ data }: ArchitectureChartProps) {
  const colors = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ef4444']

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{data.component}</p>
          <p className="text-sm text-foreground-muted">
            文檔數量: <span className="text-foreground font-medium">{data.files}</span>
          </p>
          <p className="text-sm text-foreground-muted">
            向量數量: <span className="text-blue-400 font-medium">{data.vectors}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const renderLabel = (entry: any) => {
    return `${entry.component}`
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="files"
          label={renderLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}