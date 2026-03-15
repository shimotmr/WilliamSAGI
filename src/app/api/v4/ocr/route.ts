import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ZHIPU_API_KEY not configured' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to GLM layout_parsing API
    const glmForm = new FormData();
    glmForm.append('file', file);

    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/layout_parsing', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: glmForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('GLM OCR error:', res.status, errText);
      return NextResponse.json(
        { error: `GLM API error: ${res.status}`, details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      md_results: data.data?.md_results ?? data.md_results ?? '',
      layout_details: data.data?.layout_details ?? data.layout_details ?? null,
      usage: data.usage ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('OCR route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
