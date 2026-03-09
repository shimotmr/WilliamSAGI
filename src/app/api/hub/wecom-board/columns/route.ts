import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 讀取所有欄位
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('wecom_board_columns')
      .select('*')
      .order('position');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching columns:', error);
    return NextResponse.json({ error: 'Failed to fetch columns' }, { status: 500 });
  }
}

// POST - 新增欄位
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: '欄位名稱為必填' }, { status: 400 });
    }

    // 取得最大 position
    const { data: existing } = await supabase
      .from('wecom_board_columns')
      .select('position')
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('wecom_board_columns')
      .insert({
        name,
        position: nextPosition,
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json({ error: 'Failed to create column' }, { status: 500 });
  }
}
