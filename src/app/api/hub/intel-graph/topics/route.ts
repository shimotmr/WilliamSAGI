import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: topics, error } = await supabase
    .from('intel_topics')
    .select('*, intel_nodes(count)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(topics);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('intel_topics')
    .insert({ name: body.name, description: body.description || '' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
