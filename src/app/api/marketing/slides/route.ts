import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    ok: true, 
    message: 'Not implemented yet',
    path: request.nextUrl.pathname 
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    ok: true, 
    message: 'Not implemented yet',
    path: request.nextUrl.pathname 
  })
}
