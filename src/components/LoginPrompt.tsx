'use client'

import { Lock, Clock, ShieldX } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from './AuthProvider'

type PromptType = 'login' | 'pending' | 'denied' | null

export function LoginPrompt() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signInWithGitHub } = useAuth()
  const [promptType, setPromptType] = useState<PromptType>(null)

  useEffect(() => {
    if (!searchParams) return
    if (searchParams.get('login') === 'required') setPromptType('login')
    else if (searchParams.get('access') === 'pending') setPromptType('pending')
    else if (searchParams.get('access') === 'denied') setPromptType('denied')
  }, [searchParams])

  if (!promptType) return null

  const close = () => {
    setPromptType(null)
    router.replace('/')
  }

  const configs = {
    login: {
      icon: <Lock size={24} className="text-yellow-500" />,
      iconBg: 'bg-yellow-500/10',
      title: 'Private Content',
      desc: 'This page requires authentication. Sign in with GitHub to access it.',
      action: (
        <button
          onClick={() => signInWithGitHub()}
          className="px-4 py-2 text-sm rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity font-medium"
        >
          Sign in with GitHub
        </button>
      ),
    },
    pending: {
      icon: <Clock size={24} className="text-blue-500" />,
      iconBg: 'bg-blue-500/10',
      title: 'Access Pending',
      desc: 'Your account is awaiting approval. The site owner will review your request shortly.',
      action: null,
    },
    denied: {
      icon: <ShieldX size={24} className="text-red-500" />,
      iconBg: 'bg-red-500/10',
      title: 'Access Denied',
      desc: 'You don\'t have permission to access this page.',
      action: null,
    },
  }

  const cfg = configs[promptType]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-4 text-center">
        <div className={`w-12 h-12 rounded-full ${cfg.iconBg} flex items-center justify-center mx-auto mb-4`}>
          {cfg.icon}
        </div>
        <h2 className="font-bold text-lg mb-2">{cfg.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{cfg.desc}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={close}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
          >
            {cfg.action ? 'Cancel' : 'OK'}
          </button>
          {cfg.action}
        </div>
      </div>
    </div>
  )
}
