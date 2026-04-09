import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'public/data/knowledge-graph.json');

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    let { nodes, edges } = data;

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      const visibleNodeIds = new Set(
        nodes
          .filter((node: any) => node.label.toLowerCase().includes(lowerSearch) || node.id.toLowerCase().includes(lowerSearch))
          .map((node: any) => node.id)
      );

      nodes = nodes.filter((node: any) => visibleNodeIds.has(node.id));
      edges = edges.filter((edge: any) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to));
    }

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}