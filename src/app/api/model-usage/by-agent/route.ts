import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ status: 'success', data: [
    { name: 'Travis', role: 'Manager', tokens: 125000, requests: 234 },
    { name: 'Blake', role: 'Builder', tokens: 98000, requests: 189 },
    { name: 'Rex', role: 'Thinker', tokens: 87000, requests: 156 },
  ]})
}
