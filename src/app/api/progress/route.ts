import { NextResponse } from 'next/server';

const API_BASE = process.env.PROGRESS_API_URL || 'http://localhost:18793';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('id');

  try {
    const url = taskId ? `${API_BASE}/tasks/${taskId}` : `${API_BASE}/tasks`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Progress API unreachable' }, { status: 502 });
  }
}
