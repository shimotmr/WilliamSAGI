'use client'

import { ChevronLeft, Save, Upload } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

import { showcaseAgents } from '@/lib/showcase-agents-data'

type Gender = 'male' | 'female'

interface AgentGenderConfig {
  [agentId: string]: Gender
}

export default function AdminAgentsPage() {
  const [genderConfig, setGenderConfig] = useState<AgentGenderConfig>({})
  const [saved, setSaved] = useState(false)

  // 從 localStorage 載入設定
  useEffect(() => {
    const savedConfig = localStorage.getItem('agent-gender-config')
    if (savedConfig) {
      setGenderConfig(JSON.parse(savedConfig))
    } else {
      // 預設全部為男性
      const defaultConfig: AgentGenderConfig = {}
      showcaseAgents.forEach(agent => {
        defaultConfig[agent.id] = 'male'
      })
      setGenderConfig(defaultConfig)
    }
  }, [])

  // 切換性別
  const toggleGender = (agentId: string) => {
    setGenderConfig(prev => ({
      ...prev,
      [agentId]: prev[agentId] === 'male' ? 'female' : 'male'
    }))
  }

  // 儲存設定
  const saveConfig = () => {
    localStorage.setItem('agent-gender-config', JSON.stringify(genderConfig))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 頁首 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/agents/showcase"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors mb-4"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>返回 Showcase</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Agent 管理後台
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              設定 Agent 性別與角色圖片
            </p>
          </div>
          
          <button
            onClick={saveConfig}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-5 h-5" />
            <span>{saved ? '已儲存！' : '儲存設定'}</span>
          </button>
        </div>

        {/* Agent 列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Agent
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  職稱
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  性別設定
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  角色圖片
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {showcaseAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {/* Agent 資訊 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-white font-bold`}
                      >
                        {agent.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {agent.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {agent.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 職稱 */}
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {agent.title}
                  </td>

                  {/* 性別切換 */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleGender(agent.id)}
                        className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
                          genderConfig[agent.id] === 'male'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        男
                      </button>
                      <button
                        onClick={() => toggleGender(agent.id)}
                        className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
                          genderConfig[agent.id] === 'female'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        女
                      </button>
                    </div>
                  </td>

                  {/* 角色圖片上傳（未來功能） */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">即將開放</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 說明 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
             功能說明
          </h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>• 性別設定：切換 Agent 的性別偏好（目前僅儲存於 localStorage）</li>
            <li>• 角色圖片：未來可上傳自訂角色立繪圖片（功能開發中）</li>
            <li>• 設定會即時反映到前台 Showcase 頁面</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
