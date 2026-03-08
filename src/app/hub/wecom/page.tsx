'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  company?: string;
  category?: string;
}

export default function WeComClassifierPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 從 Supabase 載入資料
    setLoading(false);
  }, []);

  const companies = [...new Set(messages.map(m => m.company).filter(Boolean))];

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = !searchTerm || 
      msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = !selectedCompany || msg.company === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">載入中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🏢 WeCom 歸類系統
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          微信客服轉傳訊息的結構化解析與公司歸類
        </p>
      </header>

      {/* 搜尋與篩選 */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="搜尋訊息內容或發送者..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">所有公司</option>
          {companies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>

      {/* 訊息列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {messages.length === 0 
              ? '尚無訊息資料。請透過 API 上傳或從 wecom_inbox.log 匯入。'
              : '沒有符合條件的訊息'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMessages.map(msg => (
              <div key={msg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {msg.sender}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(msg.timestamp).toLocaleString('zh-TW')}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{msg.content}</p>
                {msg.company && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 
                                   text-blue-800 dark:text-blue-200 rounded">
                    {msg.company}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 統計 */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{messages.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">總訊息數</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">已歸類公司</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {messages.filter(m => !m.company).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">待歸類</div>
        </div>
      </div>
    </div>
  );
}
