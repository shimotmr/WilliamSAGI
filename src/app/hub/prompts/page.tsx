'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AgentPrompt {
  id: number;
  agent_name: string;
  display_name: string;
  version: string;
  emoji: string;
  description: string;
  updated_at: string;
  last_synced_at: string;
}

export default function PromptsPage() {
  const [agents, setAgents] = useState<AgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [promptContent, setPromptContent] = useState<string>('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agent-prompts');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrompt = async (agentName: string) => {
    try {
      const res = await fetch(`/api/agent-prompts?name=${agentName}`);
      const data = await res.json();
      setPromptContent(data.content || '');
      setSelectedAgent(agentName);
    } catch (error) {
      console.error('Failed to load prompt:', error);
    }
  };

  const syncPrompts = async () => {
    if (!confirm('確定要從檔案系統同步所有 Agent 提示詞？')) return;
    
    try {
      // 觸發同步腳本（需要後端支援）
      alert('請在終端執行：bash ~/clawd/scripts/sync_agent_prompts.sh');
      fetchAgents(); // 重新載入
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent 提示詞模板</h1>
              <p className="text-sm text-gray-600 mt-1">系統化管理所有 Agent 的核心提示詞</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/"
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                返回首頁
              </Link>
              <button
                onClick={syncPrompts}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                🔄 同步檔案系統
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：Agent 列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold text-gray-900 mb-4">
                Agents ({agents.length})
              </h2>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => loadPrompt(agent.agent_name)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedAgent === agent.agent_name
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agent.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {agent.display_name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {agent.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          v{agent.version}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 同步狀態 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-800">
                <div className="font-semibold mb-1">📌 同步說明</div>
                <div>點擊「同步檔案系統」按鈕後，在終端執行：</div>
                <code className="block mt-2 p-2 bg-white rounded text-blue-900 text-xs">
                  bash ~/clawd/scripts/sync_agent_prompts.sh
                </code>
              </div>
            </div>
          </div>

          {/* 右側：提示詞內容 */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {agents.find(a => a.agent_name === selectedAgent)?.emoji}{' '}
                    {agents.find(a => a.agent_name === selectedAgent)?.display_name}
                  </h2>
                  <span className="text-sm text-gray-500">
                    v{agents.find(a => a.agent_name === selectedAgent)?.version}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                    {promptContent}
                  </pre>
                </div>
                <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                  最後同步：{new Date(agents.find(a => a.agent_name === selectedAgent)?.last_synced_at || '').toLocaleString('zh-TW')}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-gray-400 text-lg mb-2">👈</div>
                <div className="text-gray-600">請從左側選擇一個 Agent 查看提示詞</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
