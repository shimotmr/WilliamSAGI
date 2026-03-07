'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import type { DashboardTokenTrendItem } from '../types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

interface Props {
  tokenTrend: DashboardTokenTrendItem[]
}

export default function TokenTrendCard({ tokenTrend }: Props) {
  const chartData = useMemo(() => {
    return {
      labels: tokenTrend.map((item) => item.date.slice(5)),
      datasets: [
        {
          label: 'Tokens',
          data: tokenTrend.map((item) => item.tokens),
          borderColor: '#5E6AD2',
          backgroundColor: 'rgba(94,106,210,0.10)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#5E6AD2',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
        },
      ],
    }
  }, [tokenTrend])

  return (
    <Card className="rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--foreground)]">
            Token 消耗
          </div>
          <div className="text-xs text-[var(--foreground-muted)]">
            近 7 天趨勢
          </div>
        </div>
      </div>

      {tokenTrend.length === 0 ? (
        <div className="flex h-44 items-center justify-center text-sm text-[var(--foreground-muted)]">
          尚無資料
        </div>
      ) : (
        <div className="h-44">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  ticks: {
                    color: '#8A8F98',
                    font: { size: 11 },
                  },
                  grid: {
                    color: 'rgba(255,255,255,0.06)',
                  },
                },
                y: {
                  ticks: {
                    color: '#8A8F98',
                    font: { size: 11 },
                  },
                  grid: {
                    color: 'rgba(255,255,255,0.06)',
                  },
                },
              },
            }}
          />
        </div>
      )}
    </Card>
  )
}
