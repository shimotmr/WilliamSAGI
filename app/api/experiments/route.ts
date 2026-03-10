import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  const resultsDir = '/Users/travis/clawd/experiments/results';
  
  if (!fs.existsSync(resultsDir)) {
    return NextResponse.json([]);
  }

  const experiments = fs.readdirSync(resultsDir)
    .filter(d => d.startsWith('exp-'))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 20)
    .map(dir => {
      const reportPath = `${resultsDir}/${dir}/report.md`;
      let target = '', time = '', score = '', result = '';
      
      if (fs.existsSync(reportPath)) {
        const content = fs.readFileSync(reportPath, 'utf-8');
        target = content.match(/目標: (.+)/)?.[1] || '';
        time = content.match(/實際耗時: (.+)/)?.[1] || '';
        score = content.match(/評分: (\d+)/)?.[1] || '';
        result = content.match(/結果: (.+)/)?.[1] || '';
      }
      
      return {
        id: dir,
        target: target.split('/').pop() || dir,
        time,
        score,
        result,
        date: dir.replace('exp-', '').substring(0, 8)
      };
    });

  return NextResponse.json(experiments);
}
