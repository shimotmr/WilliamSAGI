import { Suspense } from 'react'
import OrderClient from './order-client'

export const dynamic = 'force-dynamic'

export default function OrderPage({ searchParams }: { searchParams: Promise<{ symbol?: string; action?: string }> }) {
  return (
    <Suspense fallback={<div className="text-slate-500 text-sm p-4">載入中...</div>}>
      <OrderWrapper searchParams={searchParams} />
    </Suspense>
  )
}

async function OrderWrapper({ searchParams }: { searchParams: Promise<{ symbol?: string; action?: string }> }) {
  const params = await searchParams
  const initialSymbol = params?.symbol || ''
  const initialAction: 'Buy' | 'Sell' = params?.action === 'sell' ? 'Sell' : 'Buy'
  return <OrderClient initialSymbol={initialSymbol} initialAction={initialAction} />
}
