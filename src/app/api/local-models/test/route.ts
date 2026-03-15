import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { model } = await req.json();
    if (!model) {
      return NextResponse.json({ error: '缺少 model 參數' }, { status: 400 });
    }

    const start = performance.now();
    const res = await fetch('http://localhost:8080/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "ok" in one word.' }],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const elapsed = Math.round(performance.now() - start);

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: '推理失敗', detail: body, ms: elapsed }, { status: 502 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? '';
    const tokens = data.usage ?? {};

    return NextResponse.json({ ms: elapsed, reply, tokens, model });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'LM Studio 無法回應', detail: e.message },
      { status: 503 }
    );
  }
}
