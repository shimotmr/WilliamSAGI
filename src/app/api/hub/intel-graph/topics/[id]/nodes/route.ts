import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const topicId = params.id;
  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from('intel_nodes').select('*').eq('topic_id', topicId).order('created_at'),
    supabase.from('intel_edges').select('*').eq('topic_id', topicId),
  ]);
  if (nodesRes.error) return NextResponse.json({ error: nodesRes.error.message }, { status: 500 });
  return NextResponse.json({ nodes: nodesRes.data, edges: edgesRes.data || [] });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const topicId = params.id;
  const body = await req.json();

  // Support batch insert
  const items = Array.isArray(body) ? body : [body];
  const rows = items.map(item => ({
    topic_id: topicId,
    type: item.type || 'person',
    name: item.name,
    data: item.data || {},
  }));

  const { data, error } = await supabase.from('intel_nodes').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body;
  const { data, error } = await supabase.from('intel_nodes').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  // Delete related edges first
  await supabase.from('intel_edges').delete().or(`source_id.eq.${id},target_id.eq.${id}`);
  const { error } = await supabase.from('intel_nodes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
