import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('http://localhost:8080/v1/models', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'LM Studio 回應異常', status: res.status }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: 'LM Studio 未啟動或無法連線', detail: e.message },
      { status: 503 }
    );
  }
}
