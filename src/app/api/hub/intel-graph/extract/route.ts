import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `從以下文字中提取所有人名和公司/機構名稱。回傳 JSON 陣列，每個元素格式: {"name": "名稱", "type": "person"|"company"|"org"}。只回傳 JSON，不要其他文字。\n\n${text}`
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await res.json();
  const content = data.content?.[0]?.text || '[]';

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const entities = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ entities });
  } catch {
    return NextResponse.json({ entities: [], raw: content });
  }
}
