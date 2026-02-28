import { NextResponse } from 'next/server'
export async function GET() {
  const days = 7
  const data = Array.from({length: days}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return { date: d.toISOString().slice(0,10), tokens: Math.floor(Math.random()*100000), cost: Math.random()*0.5 }
  })
  return NextResponse.json({ status: 'success', data })
}
