'use client'

import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from './AuthProvider'

import { createClient } from '@/lib/supabase-client'

export function LikeButton({ slug }: { slug: string }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Fetch count
    supabase
      .from('travis_daily_likes')
      .select('id', { count: 'exact', head: true })
      .eq('post_slug', slug)
      .then(({ count: c }) => setCount(c ?? 0))

    // Check if user liked
    if (user) {
      supabase
        .from('travis_daily_likes')
        .select('id')
        .eq('post_slug', slug)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setLiked(!!data))
    }
  }, [slug, user])

  const toggle = async () => {
    if (!user || loading) return
    setLoading(true)
    if (liked) {
      await supabase
        .from('travis_daily_likes')
        .delete()
        .eq('post_slug', slug)
        .eq('user_id', user.id)
      setLiked(false)
      setCount(c => c - 1)
    } else {
      await supabase
        .from('travis_daily_likes')
        .insert({ post_slug: slug, user_id: user.id })
      setLiked(true)
      setCount(c => c + 1)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={!user}
      className={`flex items-center gap-1.5 text-xs transition-colors ${
        liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
      } ${!user ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      title={user ? (liked ? 'Unlike' : 'Like') : 'Login to like'}
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      <span>{count}</span>
    </button>
  )
}
