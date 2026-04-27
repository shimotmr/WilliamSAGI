'use client'

import { useState } from 'react'
import { useSmartPolling } from '../../hooks/useSmartPolling'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ChatPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:3000', { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) 
        })
        setIsConnected(res.ok)
      } catch {
        setIsConnected(false)
      } finally {
        setChecking(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Open WebUI 未啟動</h2>
        <p className="text-gray-400 max-w-md">
          請確保 Docker 正在運行，或執行以下指令啟動：
        </p>
        <code className="mt-4 p-3 bg-gray-800 rounded text-sm text-gray-300">
          docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway ghcr.io/open-webui/open-webui:main
        </code>
      </div>
    )
  }

  return (
    <iframe 
      src="http://localhost:3000" 
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        border: 'none'
      }}
      title="Open WebUI Chat"
    />
  )
}
