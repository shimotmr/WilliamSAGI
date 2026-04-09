import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'public/data/ontology.json');

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') || '';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

    const rawData = fs.readFileSync(dataPath, 'utf8');
    let entities = JSON.parse(rawData); // Assume array of entities

    if (Array.isArray(entities)) {
      if (type) {
        entities = entities.filter((entity: any) => entity.type === type);
      }
      entities = entities.slice(0, limit);
    } else if (entities.entities && Array.isArray(entities.entities)) {
      if (type) {
        entities.entities = entities.entities.filter((entity: any) => entity.type === type);
      }
      entities.entities = entities.entities.slice(0, limit);
    }

    return NextResponse.json(entities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}