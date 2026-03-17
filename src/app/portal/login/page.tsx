'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err) setError(err)
  }, [searchParams])

  const handleMicrosoftLogin = () => {
    setIsLoading(true)
    setError('')
    window.location.href = '/api/auth/login/azure'
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🤖</div>
        <h1 className="text-2xl font-bold text-gray-800">通路營業管理系統</h1>
        <p className="text-gray-500 text-sm mt-2">請使用公司 Microsoft 帳號登入</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{error}</p>
        </div>
      )}

      <button
        onClick={handleMicrosoftLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-lg font-semibold text-base hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50 shadow-sm"
      >
        {isLoading ? (
          <span>跳轉中...</span>
        ) : (
          <>
            {/* Microsoft logo */}
            <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            <span>使用公司 Microsoft 帳號登入</span>
          </>
        )}
      </button>

      <p className="text-center mt-8 text-gray-400 text-xs">
        和椿科技 · 機器人事業處 · 通路營業部
      </p>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🤖</div>
        <h1 className="text-2xl font-bold text-gray-800">通路營業管理系統</h1>
        <p className="text-gray-500 text-sm mt-2">載入中...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
