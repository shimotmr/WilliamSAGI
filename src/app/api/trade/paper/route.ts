import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey)
}

// GET: 取得模擬持倉 + 委託記錄
export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'positions'

  try {
    if (type === 'positions') {
      const { data, error } = await supabase
        .from('paper_positions')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ ok: true, data: data || [] })
    }

    if (type === 'orders') {
      const { data, error } = await supabase
        .from('paper_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return NextResponse.json({ ok: true, data: data || [] })
    }

    if (type === 'balance') {
      const { data, error } = await supabase
        .from('paper_account')
        .select('*')
        .eq('id', 'default')
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return NextResponse.json({
        ok: true,
        data: data || { id: 'default', balance: 10000000, initial_balance: 10000000 }
      })
    }

    return NextResponse.json({ ok: false, error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// POST: 建立模擬委託（立即成交）
export async function POST(request: NextRequest) {
  const supabase = getSupabase()

  try {
    const body = await request.json()
    const { symbol, symbol_name, action, price, quantity, share_type } = body

    if (!symbol || !action || !price || !quantity) {
      return NextResponse.json({ ok: false, error: '缺少必要欄位' }, { status: 400 })
    }

    const shares = share_type === 'lot' ? quantity * 1000 : quantity
    const amount = price * shares
    const commission = Math.max(Math.round(amount * 0.001425), 20)
    const tax = action === 'sell' ? Math.round(amount * 0.003) : 0
    const totalCost = action === 'buy' ? amount + commission : -(amount - commission - tax)

    // 1. 取得帳戶餘額
    let { data: account } = await supabase
      .from('paper_account')
      .select('*')
      .eq('id', 'default')
      .single()

    if (!account) {
      // 初始化帳戶
      const { data: newAccount, error } = await supabase
        .from('paper_account')
        .upsert({ id: 'default', balance: 10000000, initial_balance: 10000000 })
        .select()
        .single()
      if (error) throw error
      account = newAccount
    }

    // 檢查餘額
    if (action === 'buy' && account.balance < totalCost) {
      return NextResponse.json({ ok: false, error: '餘額不足' }, { status: 400 })
    }

    // 2. 記錄委託單
    const { data: order, error: orderErr } = await supabase
      .from('paper_orders')
      .insert({
        symbol,
        symbol_name: symbol_name || symbol,
        action,
        price,
        quantity: shares,
        share_type: share_type || 'lot',
        amount,
        commission,
        tax,
        total_cost: totalCost,
        status: 'filled',
      })
      .select()
      .single()
    if (orderErr) throw orderErr

    // 3. 更新持倉
    const { data: existing } = await supabase
      .from('paper_positions')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (action === 'buy') {
      if (existing) {
        // 加碼：重新計算均價
        const newQty = existing.quantity + shares
        const newCost = existing.avg_cost * existing.quantity + price * shares
        const newAvg = newCost / newQty
        await supabase
          .from('paper_positions')
          .update({
            quantity: newQty,
            avg_cost: Math.round(newAvg * 100) / 100,
            current_price: price,
            market_value: newQty * price,
            cost_basis: newQty * newAvg,
            unrealized_pnl: newQty * (price - newAvg),
            unrealized_pnl_percent: ((price - newAvg) / newAvg) * 100,
            updated_at: new Date().toISOString(),
          })
          .eq('symbol', symbol)
      } else {
        // 新持倉
        await supabase
          .from('paper_positions')
          .insert({
            symbol,
            symbol_name: symbol_name || symbol,
            quantity: shares,
            avg_cost: price,
            current_price: price,
            market_value: shares * price,
            cost_basis: shares * price,
            unrealized_pnl: 0,
            unrealized_pnl_percent: 0,
          })
      }
    } else {
      // 賣出
      if (!existing || existing.quantity < shares) {
        return NextResponse.json({ ok: false, error: '持倉不足' }, { status: 400 })
      }
      const newQty = existing.quantity - shares
      if (newQty === 0) {
        await supabase.from('paper_positions').delete().eq('symbol', symbol)
      } else {
        await supabase
          .from('paper_positions')
          .update({
            quantity: newQty,
            current_price: price,
            market_value: newQty * price,
            cost_basis: newQty * existing.avg_cost,
            unrealized_pnl: newQty * (price - existing.avg_cost),
            unrealized_pnl_percent: ((price - existing.avg_cost) / existing.avg_cost) * 100,
            updated_at: new Date().toISOString(),
          })
          .eq('symbol', symbol)
      }
    }

    // 4. 更新餘額
    const newBalance = action === 'buy' ? account.balance - totalCost : account.balance + Math.abs(totalCost)
    await supabase
      .from('paper_account')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', 'default')

    return NextResponse.json({
      ok: true,
      order,
      balance: newBalance,
      message: `${action === 'buy' ? '買進' : '賣出'} ${symbol} ${shares}股 @ ${price}，成交金額 $${amount.toLocaleString()}`
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
