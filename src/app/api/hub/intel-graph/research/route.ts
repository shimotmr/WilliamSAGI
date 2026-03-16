import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 });

  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'BRAVE_API_KEY not set' }, { status: 500 });

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`;
  const res = await fetch(url, {
    headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json' },
  });

  if (!res.ok) return NextResponse.json({ error: 'Brave search failed' }, { status: 500 });
  const data = await res.json();
  const results = (data.web?.results || []).map((r: any) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));

  return NextResponse.json({ results });
}
