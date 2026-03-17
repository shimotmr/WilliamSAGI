'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Battery, MapPin, Thermometer, Lock, Unlock,
  Zap, Car, RefreshCw, Loader2, AlertCircle, WifiOff,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import SectionCard from '@/components/ui/SectionCard'

interface VehicleData {
  id: number
  display_name: string
  vin: string
  state: string
  charge_state: {
    battery_level: number
    battery_range: number
    charging_state: string
    charge_limit_soc: number
    time_to_full_charge: number
    charge_rate: number
    charger_power: number
  } | null
  drive_state: {
    latitude: number
    longitude: number
    heading: number
    speed: number | null
  } | null
  vehicle_state: {
    vehicle_name: string
    locked: boolean
    odometer: number
    car_version: string
  } | null
  climate_state: {
    inside_temp: number
    outside_temp: number
    is_climate_on: boolean
  } | null
}

interface ApiResponse {
  vehicles: VehicleData[]
  error: string | null
}

const TABS = [
  { key: 'tw', label: '台灣 🇹🇼' },
  { key: 'cn', label: '大陸 🇨🇳' },
] as const

type Region = (typeof TABS)[number]['key']

function VehicleCard({ v }: { v: VehicleData }) {
  const isAsleep = v.state === 'asleep' || v.state === 'offline'
  const cs = v.charge_state
  const ds = v.drive_state
  const vs = v.vehicle_state
  const cl = v.climate_state

  const batteryColor =
    !cs ? 'text-slate-500' :
    cs.battery_level > 60 ? 'text-emerald-400' :
    cs.battery_level > 20 ? 'text-amber-400' : 'text-red-400'

  const chargingLabel = cs?.charging_state === 'Charging'
    ? `充電中 (${cs.charge_rate} km/h · ${cs.charger_power}kW)`
    : cs?.charging_state === 'Complete' ? '充電完成'
    : cs?.charging_state === 'Disconnected' ? '未連接'
    : cs?.charging_state || '—'

  return (
    <div className="p-5 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-slate-600/70 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car size={20} className="text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-lg">
            {vs?.vehicle_name || v.display_name}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          isAsleep
            ? 'bg-slate-700 text-slate-400'
            : 'bg-emerald-500/15 text-emerald-400'
        }`}>
          {isAsleep ? '休眠中' : '線上'}
        </span>
      </div>

      {isAsleep && !cs ? (
        <div className="text-center py-6 text-slate-500">
          <WifiOff className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">車輛休眠中，無法取得即時數據</p>
          <p className="text-xs mt-1 text-slate-600">VIN: {v.vin}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Battery + Range */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery size={16} className={batteryColor} />
              <span className="text-sm text-slate-300">電量</span>
            </div>
            <div className="text-right">
              <span className={`font-mono font-bold ${batteryColor}`}>
                {cs ? `${cs.battery_level}%` : '—'}
              </span>
              {cs && (
                <span className="text-xs text-slate-500 ml-2">
                  {Math.round(cs.battery_range * 1.60934)} km
                </span>
              )}
            </div>
          </div>

          {/* Battery bar */}
          {cs && (
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  cs.battery_level > 60 ? 'bg-emerald-500' :
                  cs.battery_level > 20 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${cs.battery_level}%` }}
              />
            </div>
          )}

          {/* Charging */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className={cs?.charging_state === 'Charging' ? 'text-yellow-400' : 'text-slate-500'} />
              <span className="text-sm text-slate-300">充電</span>
            </div>
            <span className="text-sm text-slate-400">{chargingLabel}</span>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" />
              <span className="text-sm text-slate-300">位置</span>
            </div>
            <span className="text-sm text-slate-400 font-mono">
              {ds ? `${ds.latitude.toFixed(4)}, ${ds.longitude.toFixed(4)}` : '—'}
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-orange-400" />
              <span className="text-sm text-slate-300">溫度</span>
            </div>
            <span className="text-sm text-slate-400">
              {cl ? `車內 ${cl.inside_temp}°C / 車外 ${cl.outside_temp}°C` : '—'}
            </span>
          </div>

          {/* Lock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {vs?.locked ? (
                <Lock size={16} className="text-emerald-400" />
              ) : (
                <Unlock size={16} className="text-red-400" />
              )}
              <span className="text-sm text-slate-300">鎖定</span>
            </div>
            <span className={`text-sm ${vs?.locked ? 'text-emerald-400' : 'text-red-400'}`}>
              {vs ? (vs.locked ? '已鎖定' : '未鎖定') : '—'}
            </span>
          </div>

          {/* VIN */}
          <div className="pt-2 border-t border-slate-700/50">
            <span className="text-xs text-slate-600 font-mono">{v.vin}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeslaPage() {
  const [region, setRegion] = useState<Region>('tw')
  const [data, setData] = useState<Record<Region, ApiResponse>>({
    tw: { vehicles: [], error: null },
    cn: { vehicles: [], error: null },
  })
  const [loading, setLoading] = useState<Record<Region, boolean>>({ tw: false, cn: false })
  const [lastUpdated, setLastUpdated] = useState('')

  const fetchData = useCallback(async (r: Region) => {
    setLoading(prev => ({ ...prev, [r]: true }))
    try {
      const res = await fetch(`/api/hub/tesla?region=${r}`)
      const json: ApiResponse = await res.json()
      setData(prev => ({ ...prev, [r]: json }))
      setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
    } catch (err: any) {
      setData(prev => ({ ...prev, [r]: { vehicles: [], error: err.message } }))
    } finally {
      setLoading(prev => ({ ...prev, [r]: false }))
    }
  }, [])

  useEffect(() => {
    fetchData('tw')
    fetchData('cn')
  }, [fetchData])

  const current = data[region]
  const isLoading = loading[region]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tesla 車輛"
        description="雙帳號車輛狀態即時監控"
      />

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setRegion(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              region === tab.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => fetchData(region)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          重新整理
        </button>
      </div>

      {/* Status bar */}
      {lastUpdated && (
        <p className="text-xs text-slate-600">最後更新：{lastUpdated}</p>
      )}

      {/* Auth button when no credentials */}
      {current.error && current.error.includes('No credentials') && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-slate-400 text-sm">尚未連結 Tesla 帳號</p>
          <a
            href={`/api/tesla/login`}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/25"
          >
            連結 Tesla 帳號
          </a>
        </div>
      )}

      {/* Error */}
      {current.error && !current.error.includes('No credentials') && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{current.error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && current.vehicles.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-slate-400">載入車輛資料...</span>
        </div>
      ) : current.vehicles.length === 0 && !current.error ? (
        <SectionCard title="車輛">
          <div className="text-center py-12 text-slate-500">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>此帳號沒有車輛資料</p>
          </div>
        </SectionCard>
      ) : (
        /* Vehicle Cards - 2 columns desktop, 1 mobile */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {current.vehicles.map(v => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  )
}
