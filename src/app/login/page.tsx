import { Suspense } from 'react'
import LoginForm from './LoginForm'
export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">載入中...</div></div>}><LoginForm /></Suspense>
}
