'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Car, Clock, Zap, DollarSign, Loader2, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import SectionCard from '@/components/ui/SectionCard'

interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
  description?: string
}

interface TeslaTrip {
  id: number
  car_name: string
  start_location?: string
  end_location?: string
  distance_km: number
  duration_minutes: number
  recorded_at: string
}

interface TripEstimation {
  distance_km: number
  duration_minutes: number
  battery_needed_percent: number
  estimated_cost: number
}

export default function SchedulePage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [trips, setTrips] = useState<TeslaTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    let mounted = true
    const loadData = async () => {
      try {
        // Fetch calendar events
        const calRes = await fetch('/api/schedule/calendar')
        const calData = await calRes.json()
        
        // Fetch Tesla trips
        const tripRes = await fetch('/api/schedule/tesla-trips')
        const tripData = await tripRes.json()
        
        if (!mounted) return
        
        if (calData.events) setEvents(calData.events)
        if (tripData.trips) setTrips(tripData.trips)
        
        setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }))
        setError('')
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : '載入失敗')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadData()
  }, [])

  const estimateTrip = (destination: string): TripEstimation => {
    // Simple estimation based on common destinations in Taiwan
    const baseDistances: Record<string, number> = {
      '內湖': 5,
      '南崁': 25,
      '桃園': 30,
      '台北': 10,
      '新竹': 60,
      '台中': 150,
      '高雄': 300,
    }
    
    let distance = 10 // default
    for (const [key, val] of Object.entries(baseDistances)) {
      if (destination?.includes(key)) {
        distance = val
        break
      }
    }
    
    // Assume average speed 60km/h in city, 90km/h on highway
    const avgSpeed = distance > 50 ? 90 : 60
    const duration = Math.round((distance / avgSpeed) * 60)
    
    // Tesla Model 3 consumes ~15kWh per 100km
    const batteryNeeded = Math.round((distance / 100) * 15 / 75 * 100) // 75kWh battery
    
    // Electricity cost: ~3.5 TWD/kWh
    const cost = Math.round((distance / 100) * 15 * 3.5)
    
    return { distance_km: distance, duration_minutes: duration, battery_needed_percent: batteryNeeded, estimated_cost: cost }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-TW', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-slate-400">載入中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="行程管理"
        description="Google Calendar 行程整合 · Tesla 車輛歷史"
        lastUpdated={lastUpdated}
      />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Upcoming Calendar Events */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">即將到來的行程</h2>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>近期無行程</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 10).map((event) => {
              const estimation = estimateTrip(event.location)
              return (
                <div
                  key={event.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-indigo-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-100">{event.summary}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDateTime(event.start?.dateTime)}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {event.location && (
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Car size={14} />
                          {estimation.distance_km} km
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Zap size={14} />
                          ~{estimation.battery_needed_percent}%
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <DollarSign size={14} />
                          ~{estimation.estimated_cost} 元
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* Tesla Trip History */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Car className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-100">Tesla 行程歷史</h2>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>無行程記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.slice(0, 10).map((trip) => (
              <div
                key={trip.id}
                className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{trip.car_name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">
                        {trip.distance_km} km
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                      {trip.start_location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {trip.start_location}
                        </span>
                      )}
                      {trip.end_location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} className="rotate-180" />
                          {trip.end_location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {trip.duration_minutes} 分鐘
                    </div>
                    <div className="text-slate-500 mt-1">
                      {new Date(trip.recorded_at).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
