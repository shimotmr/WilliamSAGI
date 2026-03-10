import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const reportPath = `/Users/travis/clawd/experiments/results/${params.id}/report.md`;
  
  if (!fs.existsSync(reportPath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  const content = fs.readFileSync(reportPath, 'utf-8');
  return NextResponse.json(content);
}
