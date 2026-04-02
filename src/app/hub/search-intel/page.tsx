import { Suspense } from 'react'

import SearchIntelAdmin from './SearchIntelAdmin'

export default function SearchIntelPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-10 text-sm text-neutral-400">載入 Search Intel…</div>}>
      <SearchIntelAdmin />
    </Suspense>
  )
}
