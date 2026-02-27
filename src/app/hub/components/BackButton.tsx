'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  className?: string
}

export function BackButton({ className = '' }: BackButtonProps) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${className}`}
    >
      <ArrowLeft size={16} />
      返回
    </button>
  )
}
