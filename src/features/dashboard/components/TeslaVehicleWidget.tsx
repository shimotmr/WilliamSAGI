'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Car, Gauge, MapPin, ParkingCircle, Route, Zap } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type VehicleLog = {
  id: number
  car_name: string
  vin: string
  region: string
  soc: number
  range_km: number
  odometer_km: number
  charging_state: string
  recorded_at: string
}

type RegionCard = {
  region: string
  latest: VehicleLog | null
  history: { time: string; soc: number }[]
}

const REGIONS = ['台灣', '中國']

function minutesAgo(iso?: string) {
  if (!iso) return '—'
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (diff < 1) return '剛剛'
  if (diff < 60) return `${diff} 分鐘前`
  const hours = Math.floor(diff / 60)
  if (hours < 24) return `${hours} 小時前`
  return `${Math.floor(hours / 24)} 天前`
}

function chargingMeta(state?: string) {
  const s = (state || '').toLowerCase()
  if (s.includes('charg')) return { label: '充電中', Icon: Zap, cls: 'text-emerald-500 animate-pulse' }
  if (s.includes('park') || s.includes('stop')) return { label: '停放中', Icon: ParkingCircle, cls: 'text-slate-500' }
  return { label: '行駛中', Icon: Route, cls: 'text-sky-500' }
}

function BatteryArc({ soc }: { soc: number }) {
  const value = Math.max(0, Math.min(100, soc || 0))
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - value / 100)
  const low = value < 20

  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} className="fill-none stroke-slate-200" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={`fill-none transition-all duration-300 ${low ? 'stroke-red-500' : 'stroke-emerald-500'}`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${low ? 'text-red-500' : 'text-slate-800'}`}>
        {value}%
      </div>
    </div>
  )
}

function SkeletonCard({ region }: { region: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
        <span className="text-xs text-slate-400">{region}</span>
      </div>
      <div className="grid grid-cols-[96px_1fr] gap-4">
        <div className="h-24 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
    </div>
  )
}

export default function TeslaVehicleWidget() {
  const [cards, setCards] = useState<RegionCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      setCards(REGIONS.map((region) => ({ region, latest: null, history: [] })))
      setLoading(false)
      return
    }

    const supabase = createClient(url, key)
    let mounted = true

    const load = async () => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from('tesla_vehicle_logs')
        .select('id, car_name, vin, region, soc, range_km, odometer_km, charging_state, recorded_at')
        .gte('recorded_at', sevenDaysAgo)
        .order('recorded_at', { ascending: false })

      if (!mounted) return

      const byRegion = REGIONS.map((region) => {
        const list = ((data || []) as VehicleLog[]).filter((d) => d.region === region)
        const latest = list[0] || null
        const history = [...list]
          .reverse()
          .map((item) => ({
            time: new Date(item.recorded_at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
            soc: Number(item.soc) || 0,
          }))
        return { region, latest, history }
      })

      setCards(byRegion)
      setLoading(false)
    }

    load()
    const timer = setInterval(load, 60000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  const renderedCards = useMemo(() => {
    if (loading) return REGIONS.map((region) => <SkeletonCard key={region} region={region} />)

    return cards.map(({ region, latest, history }) => {
      if (!latest) {
        return (
          <div key={region} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Tesla 車況</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{region}</span>
            </div>
            <div className="flex h-52 items-center justify-center text-sm text-slate-500">目前無資料</div>
          </div>
        )
      }

      const charge = chargingMeta(latest.charging_state)

      return (
        <div key={region} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-slate-600" />
              <h3 className="text-base font-semibold text-slate-800">{latest.car_name || 'Tesla'}</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{region}</span>
          </div>

          <div className="grid grid-cols-[96px_1fr] gap-4">
            <BatteryArc soc={latest.soc} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Gauge className="h-4 w-4 text-slate-500" />
                <span>續航 {Math.round(Number(latest.range_km) || 0)} km</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <charge.Icon className={`h-4 w-4 ${charge.cls}`} />
                <span>{charge.label}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>里程 {Math.round(Number(latest.odometer_km) || 0).toLocaleString()} km</span>
              </div>
              <div className="text-xs text-slate-500">更新於 {minutesAgo(latest.recorded_at)}</div>
            </div>
          </div>

          <div className="mt-4 h-24 rounded-lg bg-slate-50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-30)}>
                <defs>
                  <linearGradient id={`soc-${region}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  formatter={(value) => [`${value}%`, '電量']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="soc" stroke="#22c55e" strokeWidth={2} fill={`url(#soc-${region})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    })
  }, [cards, loading])

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-[var(--foreground-muted)]">Tesla 車況監控</h2>
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">{renderedCards}</div>
    </section>
  )
}
