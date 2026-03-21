'use client'

import React from 'react'
import Link from 'next/link'

export default function TaskFlowPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/hub/v4-2" className="text-blue-400 hover:text-blue-300 text-sm">
              ← V4.2 系統中心
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">任務統一入口流程</h1>
          <p className="text-slate-400">Unified Task Entry Point — 從任務來源到完成驗收的完整閉環</p>
        </div>

        {/* Overview */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">🎯 設計理念</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-blue-400 font-medium mb-2">單一入口</div>
              <p className="text-sm text-slate-300">所有任務來源（Telegram/Vercel/審計/API）統一走 create_task.sh</p>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-green-400 font-medium mb-2">Gate 檢查</div>
              <p className="text-sm text-slate-300">5 層把關確保任務品質與安全</p>
            </div>
            <div className="bg-slate-700/50 rounded p-4">
              <div className="text-purple-400 font-medium mb-2">自動閉環</div>
              <p className="text-sm text-slate-300">派發 → 執行 → 驗收 → 完成 → 審計，全程自動化</p>
            </div>
          </div>
        </div>

        {/* Main Flow Chart */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">📊 完整任務流程圖</h2>
          
          {/* Flow Diagram */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Sources */}
              <div className="mb-8">
                <div className="text-sm text-slate-400 mb-2">任務來源</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded p-3 text-center text-sm">
                    <div className="text-blue-400">📱 Telegram</div>
                    <div className="text-xs text-slate-400 mt-1">William 發送需求</div>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-500/50 rounded p-3 text-center text-sm">
                    <div className="text-orange-400">🚨 Vercel</div>
                    <div className="text-xs text-slate-400 mt-1">Build Error</div>
                  </div>
                  <div className="bg-purple-500/20 border border-purple-500/50 rounded p-3 text-center text-sm">
                    <div className="text-purple-400">🔍 審計系統</div>
                    <div className="text-xs text-slate-400 mt-1">自動偵測問題</div>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/50 rounded p-3 text-center text-sm">
                    <div className="text-green-400">🔗 API/排程</div>
                    <div className="text-xs text-slate-400 mt-1">外部觸發</div>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-2xl">↓</div>
              </div>

              {/* Unified Entry */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-cyan-400 font-bold text-lg mb-2">🦞 create_task.sh</div>
                    <div className="text-slate-300">統一任務入口</div>
                  </div>
                </div>
              </div>

              {/* Gates */}
              <div className="mb-8">
                <div className="text-sm text-slate-400 mb-2">5 層 Gate 檢查</div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="bg-red-500/20 border border-red-500/50 rounded p-3 text-center">
                    <div className="text-red-400 text-sm font-medium">Gate 1</div>
                    <div className="text-xs text-slate-300 mt-1">必填欄位</div>
                    <div className="text-xs text-slate-500 mt-1">title, assignee</div>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3 text-center">
                    <div className="text-yellow-400 text-sm font-medium">Gate 2</div>
                    <div className="text-xs text-slate-300 mt-1">驗收標準</div>
                    <div className="text-xs text-slate-500 mt-1">品質檢查</div>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3 text-center">
                    <div className="text-yellow-400 text-sm font-medium">Gate 3</div>
                    <div className="text-xs text-slate-300 mt-1">Prompt 品質</div>
                    <div className="text-xs text-slate-500 mt-1">評分 ≥30</div>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-500/50 rounded p-3 text-center">
                    <div className="text-orange-400 text-sm font-medium">Gate 4</div>
                    <div className="text-xs text-slate-300 mt-1">安全掃描</div>
                    <div className="text-xs text-slate-500 mt-1">無危險指令</div>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded p-3 text-center">
                    <div className="text-blue-400 text-sm font-medium">Gate 5</div>
                    <div className="text-xs text-slate-300 mt-1">錯誤路由</div>
                    <div className="text-xs text-slate-500 mt-1">自動分類</div>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-2xl">↓</div>
              </div>

              {/* Database */}
              <div className="mb-8">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 max-w-md mx-auto text-center">
                  <div className="text-slate-300 font-medium">💾 board_tasks</div>
                  <div className="text-xs text-slate-400 mt-1">status = '待派發'</div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-2xl">↓</div>
              </div>

              {/* Dispatch */}
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700/30 rounded p-4 text-center">
                    <div className="text-slate-400 text-sm">Heartbeat 觸發</div>
                    <div className="text-white mt-2">auto_dispatch.sh</div>
                  </div>
                  <div className="bg-slate-700/30 rounded p-4 text-center">
                    <div className="text-slate-400 text-sm">讀取任務</div>
                    <div className="text-white mt-2">UPDATE '執行中'</div>
                  </div>
                  <div className="bg-slate-700/30 rounded p-4 text-center">
                    <div className="text-slate-400 text-sm">派發給 Agent</div>
                    <div className="text-white mt-2">sessions_spawn</div>
                  </div>
                </div>
              </div>

              {/* Agents */}
              <div className="mb-8">
                <div className="text-sm text-slate-400 mb-2">Subagent 執行</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-blue-600/20 border border-blue-500/50 rounded p-3 text-center">
                    <div className="text-blue-400 font-medium">Blake</div>
                    <div className="text-xs text-slate-400">程式碼/UI</div>
                  </div>
                  <div className="bg-purple-600/20 border border-purple-500/50 rounded p-3 text-center">
                    <div className="text-purple-400 font-medium">Rex</div>
                    <div className="text-xs text-slate-400">研究/分析</div>
                  </div>
                  <div className="bg-green-600/20 border border-green-500/50 rounded p-3 text-center">
                    <div className="text-green-400 font-medium">Oscar</div>
                    <div className="text-xs text-slate-400">行事曆</div>
                  </div>
                  <div className="bg-orange-600/20 border border-orange-500/50 rounded p-3 text-center">
                    <div className="text-orange-400 font-medium">Travis</div>
                    <div className="text-xs text-slate-400">系統管理</div>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-2xl">↓</div>
              </div>

              {/* Verification */}
              <div className="mb-8">
                <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-6 max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="text-amber-400 font-bold text-lg mb-2">✅ verify_and_complete.sh</div>
                    <div className="text-slate-300 text-sm mb-4">驗收流程</div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-700/50 rounded p-2 text-center">
                        <div className="text-slate-400">script:</div>
                        <div className="text-white">執行腳本</div>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2 text-center">
                        <div className="text-slate-400">url:</div>
                        <div className="text-white">檢查網址</div>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2 text-center">
                        <div className="text-slate-400">db:</div>
                        <div className="text-white">SQL 查詢</div>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2 text-center">
                        <div className="text-slate-400">skip:</div>
                        <div className="text-white">跳過驗收</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center mb-4">
                <div className="text-2xl">↓</div>
              </div>

              {/* Completion */}
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-500/20 border border-green-500/50 rounded p-4 text-center">
                    <div className="text-green-400 font-medium">task_complete.sh</div>
                    <div className="text-xs text-slate-300 mt-1">標記完成</div>
                  </div>
                  <div className="bg-purple-500/20 border border-purple-500/50 rounded p-4 text-center">
                    <div className="text-purple-400 font-medium">Griffin 審計</div>
                    <div className="text-xs text-slate-300 mt-1">品質審查</div>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-500/50 rounded p-4 text-center">
                    <div className="text-blue-400 font-medium">Telegram 通知</div>
                    <div className="text-xs text-slate-300 mt-1">閉環完成</div>
                  </div>
                </div>
              </div>

              {/* Final State */}
              <div>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-lg p-6 max-w-md mx-auto text-center">
                  <div className="text-green-400 font-bold text-lg">🎉 任務完成</div>
                  <div className="text-slate-300 text-sm mt-2">status = '已完成'</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Scripts */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">🔧 關鍵腳本</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left p-2">腳本</th>
                  <th className="text-left p-2">功能</th>
                  <th className="text-left p-2">觸發時機</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-700/50">
                  <td className="p-2 text-cyan-400">create_task.sh</td>
                  <td className="p-2">統一入口 + Gate 檢查</td>
                  <td className="p-2">任何來源建立任務時</td>
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="p-2 text-blue-400">auto_dispatch.sh</td>
                  <td className="p-2">讀取待派發任務並 spawn</td>
                  <td className="p-2">Heartbeat (每 10 分鐘)</td>
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="p-2 text-amber-400">verify_and_complete.sh</td>
                  <td className="p-2">驗收後標記完成</td>
                  <td className="p-2">Subagent 完成後</td>
                </tr>
                <tr className="border-b border-slate-700/50">
                  <td className="p-2 text-green-400">task_complete.sh</td>
                  <td className="p-2">更新狀態 + 通知</td>
                  <td className="p-2">驗收通過後</td>
                </tr>
                <tr>
                  <td className="p-2 text-purple-400">task_helper.py</td>
                  <td className="p-2">Python 共用函式</td>
                  <td className="p-2">Python 腳本呼叫</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">💡 統一入口的好處</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700/30 rounded p-4">
              <div className="text-green-400 font-medium mb-2">✅ 品質保證</div>
              <p className="text-sm text-slate-300">所有任務都經過 Gate 檢查，確保必填欄位、驗收標準、prompt 品質都達標</p>
            </div>
            <div className="bg-slate-700/30 rounded p-4">
              <div className="text-green-400 font-medium mb-2">✅ 安全防護</div>
              <p className="text-sm text-slate-300">Gate 4 掃描危險指令，防止惡意 prompt 注入</p>
            </div>
            <div className="bg-slate-700/30 rounded p-4">
              <div className="text-green-400 font-medium mb-2">✅ 可擴充</div>
              <p className="text-sm text-slate-300">新增任務來源只需呼叫 create_task.sh，不用另做流程</p>
            </div>
            <div className="bg-slate-700/30 rounded p-4">
              <div className="text-green-400 font-medium mb-2">✅ 統一閉環</div>
              <p className="text-sm text-slate-300">派發 → 執行 → 驗收 → 完成 → 審計，全自動化不遺漏</p>
            </div>
            <div className="bg-slate-700/30 rounded p-4">
              <div className="text-blue-400 font-medium mb-2">📊 可追蹤</div>
              <p className="text-sm text-slate-300">所有任務都進 board_tasks，狀態一目瞭然</p>
            </div>
            <div className="bg-slate-700/30 rounded p-4">
              <div className="text-purple-400 font-medium mb-2">🔄 易維護</div>
              <p className="text-sm text-slate-300">修改流程只需改 create_task.sh，所有來源自動生效</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>SAGI V4.2 任務統一入口 | 2026-03-18</p>
        </div>
      </div>
    </div>
  )
}
