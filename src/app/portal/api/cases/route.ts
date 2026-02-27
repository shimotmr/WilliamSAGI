import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const rep = searchParams.get('rep')
    const dealer = searchParams.get('dealer')
    const search = searchParams.get('search')

    let query = supabase.from('cases').select('*')

    if (stage) query = query.eq('stage', stage)
    if (rep) query = query.eq('rep', rep)
    if (dealer) query = query.eq('dealer', dealer)
    if (search) {
      // Escape special PostgREST characters to prevent query injection
      const safeSearch = search.replace(/[%_(),*]/g, '').slice(0, 100)
      query = query.or(
        `end_customer.ilike.%${safeSearch}%,machine.ilike.%${safeSearch}%,dealer.ilike.%${safeSearch}%,id.ilike.%${safeSearch}%`
      )
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    const cases = (data || []).map(c => ({
      id: c.id,
      stage: c.stage,
      orderId: c.order_id || '',
      rep: c.rep || '',
      dealer: c.dealer || '',
      endCustomer: c.end_customer || '',
      machine: c.machine || '',
      probability: c.probability || 0,
      quantity: c.quantity || 0,
      amount: c.amount || 0,
      expected: c.expected || 0,
      orderDate: c.order_date || '',
      shipDate: c.ship_date || '',
      category: c.category || '',
      brand: c.brand || '',
    }))

    return NextResponse.json({
      cases,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cases API Error:', error)
    return NextResponse.json({
      cases: [],
      updatedAt: new Date().toISOString(),
      error: 'Failed to fetch cases from Supabase',
    })
  }
}
