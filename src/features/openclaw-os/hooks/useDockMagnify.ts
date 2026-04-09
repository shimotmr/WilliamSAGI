'use client'

import { useMemo, useState } from 'react'

export function useDockMagnify(count: number) {
  const [pointerX, setPointerX] = useState<number | null>(null)

  const scales = useMemo(
    () => Array.from({ length: count }, (_, index) => {
      if (pointerX == null) return 1
      const itemCenter = index * 72 + 36
      const distance = Math.abs(pointerX - itemCenter)
      const normalized = Math.max(0, 1 - distance / 140)
      return 1 + normalized * 0.65
    }),
    [count, pointerX],
  )

  return {
    scales,
    setPointerX,
    reset: () => setPointerX(null),
  }
}
