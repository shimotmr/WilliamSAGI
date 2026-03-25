"use client"

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useSupabaseRealtime(
  table: string,
  onUpdate: () => void,
  filter?: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channelName = `realtime-${table}-${Date.now()}`

    const opts: any = {
      event: '*',
      schema: 'public',
      table,
    }
    if (filter) opts.filter = filter

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', opts, () => {
        onUpdate()
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter]) // intentionally exclude onUpdate to avoid re-subscribing

  return channelRef
}
