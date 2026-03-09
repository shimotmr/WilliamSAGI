'use client';

import { useState, useEffect } from 'react';
import { 
  Car, Battery, MapPin, Zap, Clock, 
  DollarSign, Navigation, RefreshCw, 
  ChevronRight, BatteryCharging, Gauge
} from 'lucide-react';

// Types
interface VehicleStatus {
  display_name: string;
  battery_level: number;
  range: number;
  location: {
    lat: number;
    lng: number;
    heading: number;
  } | null;
  charging_state: string;
  time_to_full_charge: number;
  speed: number;
  is_climate_on: boolean;
  inside_temp: number;
  outside_temp: number;
}

interface ChargingStation {
  name: string;
  address: string;
  distance: number;
  available_stalls: number;
  total_stalls: number;
  price_per_kwh: number;
  operator: string;
  lat: number;
  lng: number;
}

interface TripEstimate {
  distance: number;
  duration: number;
  energy_needed: number;
  stops: number;
  cost: number;
}

export default function TeslaPage() {
  const [loading, setLoading] = useState(true);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatus | null>(null);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [tripEstimate, setTripEstimate] = useState<TripEstimate | null>(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'stations' | 'trip'>('status');

  // Fetch vehicle status
  const fetchVehicleStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tesla/vehicle');
      const data = await res.json();
      if (data.status === 'success') {
        setVehicleStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch vehicle status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch nearby charging stations
  const fetchChargingStations = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/tesla/charging?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.status === 'success') {
        setChargingStations(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch charging stations:', err);
    }
  };

  // Calculate trip estimate
  const calculateTrip = async () => {
    if (!destination || !vehicleStatus?.location) return;
    
    try {
      // Use a simple geocoding simulation (in real app, use a geocoding API)
      const mockCoords = { lat: 25.0330 + Math.random() * 0.1, lng: 121.5654 + Math.random() * 0.1 };
      setDestinationCoords(mockCoords);
      
      const res = await fetch('/api/tesla/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: vehicleStatus.location,
          destination: mockCoords,
          battery_level: vehicleStatus.battery_level,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setTripEstimate(data.data);
      }
    } catch (err) {
      console.error('Failed to calculate trip:', err);
    }
  };

  useEffect(() => {
    fetchVehicleStatus();
  }, []);

  useEffect(() => {
    if (vehicleStatus?.location) {
      fetchChargingStations(vehicleStatus.location.lat, vehicleStatus.location.lng);
    }
  }, [vehicleStatus?.location]);

  // Render battery indicator
  const renderBatteryIndicator = (level: number) => {
    const colors = {
      high: '#4ade80',
      medium: '#fbbf24',
      low: '#f87171',
      charging: '#60a5fa',
    };
    
    let color = colors.high;
    if (level < 20) color = colors.low;
    else if (level < 50) color = colors.medium;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '48px', height: '24px', borderRadius: '4px',
          border: `2px solid ${color}`, display: 'flex', alignItems: 'center',
          padding: '2px', position: 'relative',
        }}>
          <div style={{
            width: `${level}%`, height: '100%', borderRadius: '2px',
            background: color, transition: 'width 300ms ease',
          }} />
        </div>
        <Battery size={20} color={color} />
        <span style={{ fontWeight: 600, color }}>{level}%</span>
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#050506', 
      color: '#EDEDEF', 
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '1.5rem',
    }}>
      <style>{`
        .tesla-card {
          background: linear-gradient(145deg, #0f0f12 0%, #0a0a0c 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 200ms ease;
        }
        .tesla-card:hover {
          border-color: rgba(94,106,210,0.2);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .tesla-btn {
          background: linear-gradient(135deg, #5E6AD2 0%, #4f5bb8 100%);
          border: none;
          border-radius: 10px;
          padding: 0.625rem 1.25rem;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .tesla-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(94,106,210,0.4);
        }
        .tesla-btn-outline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: #8A8F98;
        }
        .tesla-btn-outline:hover {
          border-color: #5E6AD2;
          color: #EDEDEF;
        }
        .tab-active {
          background: rgba(94,106,210,0.15);
          color: #5E6AD2;
          border-color: rgba(94,106,210,0.3);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Car size={28} color="#5E6AD2" />
            Tesla 交通評估
          </h1>
          <p style={{ color: '#8A8F98', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            車輛狀態 • 充電站 • 行程規劃
          </p>
        </div>
        <button className="tesla-btn" onClick={fetchVehicleStatus} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          重新整理
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        background: 'rgba(255,255,255,0.02)',
        padding: '0.25rem',
        borderRadius: '12px',
        width: 'fit-content',
      }}>
        {[
          { id: 'status', label: '車輛狀態', icon: Gauge },
          { id: 'stations', label: '充電站', icon: Zap },
          { id: 'trip', label: '行程規劃', icon: Navigation },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tesla-btn tesla-btn-outline ${activeTab === tab.id ? 'tab-active' : ''}`}
            style={{ 
              borderRadius: '8px',
              background: activeTab === tab.id ? 'rgba(94,106,210,0.15)' : 'transparent',
              border: 'none',
              color: activeTab === tab.id ? '#5E6AD2' : '#8A8F98',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#8A8F98' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>載入中...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {/* Main Vehicle Card */}
              <div className="tesla-card" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{vehicleStatus?.display_name || 'Tesla'}</h3>
                    <p style={{ color: '#8A8F98', fontSize: '0.875rem' }}>
                      {vehicleStatus?.charging_state === 'charging' ? '🔌 充電中' : '✅ 就緒'}
                    </p>
                  </div>
                  <Gauge size={24} color="#5E6AD2" />
                </div>
                
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <BatteryCharging size={32} color={vehicleStatus?.battery_level && vehicleStatus.battery_level > 50 ? '#4ade80' : '#fbbf24'} />
                    <div>
                      <p style={{ fontSize: '2rem', fontWeight: 700 }}>{vehicleStatus?.battery_level || 0}%</p>
                      <p style={{ color: '#8A8F98', fontSize: '0.75rem' }}>電量</p>
                    </div>
                  </div>
                  
                  {renderBatteryIndicator(vehicleStatus?.battery_level || 0)}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '1rem', 
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{vehicleStatus?.range || 0} km</p>
                    <p style={{ color: '#8A8F98', fontSize: '0.75rem' }}>剩餘里程</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{vehicleStatus?.speed || 0} km/h</p>
                    <p style={{ color: '#8A8F98', fontSize: '0.75rem' }}>當前速度</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{vehicleStatus?.time_to_full_charge || 0} min</p>
                    <p style={{ color: '#8A8F98', fontSize: '0.75rem' }}>充滿時間</p>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="tesla-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MapPin size={18} color="#5E6AD2" />
                  <h4 style={{ fontWeight: 600 }}>位置</h4>
                </div>
                {vehicleStatus?.location ? (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>目前位置</p>
                    <p style={{ marginTop: '0.25rem' }}>
                      {vehicleStatus.location.lat.toFixed(4)}, {vehicleStatus.location.lng.toFixed(4)}
                    </p>
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem', 
                      background: 'rgba(94,106,210,0.1)', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <Navigation size={14} color="#5E6AD2" />
                      <span style={{ fontSize: '0.75rem' }}>方向 {vehicleStatus.location.heading}°</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: '#8A8F98' }}>無法取得位置</p>
                )}
              </div>

              {/* Climate Card */}
              <div className="tesla-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Clock size={18} color="#5E6AD2" />
                  <h4 style={{ fontWeight: 600 }}>車內環境</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{vehicleStatus?.inside_temp || '--'}°</p>
                    <p style={{ color: '#8A8F98', fontSize: '0.75rem' }}>車內溫度</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{vehicleStatus?.outside_temp || '--'}°</p>
                    <p style={{ color: '#8A8F98', fontSize: '0.75rem' }}>車外溫度</p>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.5rem', 
                  background: vehicleStatus?.is_climate_on ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                }}>
                  {vehicleStatus?.is_climate_on ? '🌡️ 空調開啟' : '❄️ 空調關閉'}
                </div>
              </div>
            </div>
          )}

          {/* Charging Stations Tab */}
          {activeTab === 'stations' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem' 
              }}>
                <h3 style={{ fontWeight: 600 }}>附近充電站</h3>
                <span style={{ color: '#8A8F98', fontSize: '0.875rem' }}>
                  找到 {chargingStations.length} 個充電站
                </span>
              </div>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {chargingStations.map((station, idx) => (
                  <div key={idx} className="tesla-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={18} color="#fbbf24" />
                        <h4 style={{ fontWeight: 600 }}>{station.name}</h4>
                      </div>
                      <p style={{ color: '#8A8F98', fontSize: '0.875rem', marginTop: '0.25rem' }}>{station.address}</p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                        <span style={{ color: station.available_stalls > 0 ? '#4ade80' : '#f87171' }}>
                          ⚡ {station.available_stalls}/{station.total_stalls} 可用
                        </span>
                        <span style={{ color: '#8A8F98' }}>💰 ${station.price_per_kwh}/度</span>
                        <span style={{ color: '#8A8F98' }}>📍 {station.distance.toFixed(1)} km</span>
                      </div>
                    </div>
                    <button className="tesla-btn tesla-btn-outline" style={{ padding: '0.5rem' }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                ))}
                
                {chargingStations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#8A8F98' }}>
                    <Zap size={48} style={{ opacity: 0.3, margin: '0 auto' }} />
                    <p style={{ marginTop: '1rem' }}>載入充電站中...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trip Tab */}
          {activeTab === 'trip' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="tesla-card">
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>規劃行程</h3>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#8A8F98', marginBottom: '0.5rem' }}>
                    目的地
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="輸入目的地..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#EDEDEF',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <button 
                  className="tesla-btn" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={calculateTrip}
                  disabled={!destination || !vehicleStatus}
                >
                  <Navigation size={16} />
                  計算行程
                </button>

                {tripEstimate && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>行程預估</h4>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8F98' }}>距離</span>
                        <span style={{ fontWeight: 600 }}>{tripEstimate.distance} km</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8F98' }}>時間</span>
                        <span style={{ fontWeight: 600 }}>{Math.floor(tripEstimate.duration / 60)} 小時 {tripEstimate.duration % 60} 分</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8F98' }}>所需電量</span>
                        <span style={{ fontWeight: 600 }}>{tripEstimate.energy_needed} kWh</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8A8F98' }}>充電次數</span>
                        <span style={{ fontWeight: 600 }}>{tripEstimate.stops} 次</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        marginTop: '0.5rem',
                      }}>
                        <span style={{ color: '#8A8F98' }}>預估費用</span>
                        <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '1.125rem' }}>NT$ {tripEstimate.cost}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Battery Check */}
              <div className="tesla-card">
                <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>電量檢查</h3>
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  {vehicleStatus ? (
                    <>
                      <Battery size={48} color={vehicleStatus.battery_level > 20 ? '#4ade80' : '#f87171'} style={{ margin: '0 auto' }} />
                      <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '1rem' }}>
                        {vehicleStatus.battery_level}%
                      </p>
                      <p style={{ color: '#8A8F98' }}>
                        約可行駛 {vehicleStatus.range} km
                      </p>
                      {vehicleStatus.battery_level < 20 && (
                        <div style={{ 
                          marginTop: '1rem', 
                          padding: '0.75rem', 
                          background: 'rgba(248,113,113,0.1)', 
                          borderRadius: '8px',
                          color: '#f87171',
                          fontSize: '0.875rem',
                        }}>
                          ⚠️ 電量過低，建議儘快充電
                        </div>
                      )}
                    </>
                  ) : (
                    <p style={{ color: '#8A8F98' }}>無法取得電量資訊</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
