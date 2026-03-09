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
      .order('position', { ascending: true });

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

// DELETE - 刪除欄位（非預設欄才可刪）
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    // 不允許刪除預設欄
    const { data: col } = await supabase
      .from('wecom_board_columns')
      .select('is_default')
      .eq('id', id)
      .single();

    if (col?.is_default) {
      return NextResponse.json({ error: '無法刪除預設欄「未分類」' }, { status: 403 });
    }

    // 將此欄的卡片移回「未分類」(column_id=1)
    await supabase
      .from('wecom_messages')
      .update({ column_id: 1 })
      .eq('column_id', parseInt(id));

    const { error } = await supabase
      .from('wecom_board_columns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting column:', error);
    return NextResponse.json({ error: 'Failed to delete column' }, { status: 500 });
  }
}

// PATCH - 重新命名欄位 或 重新排序
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    // 重新排序（接收 ids 陣列）
    if (body.ids && Array.isArray(body.ids)) {
      // 批量更新 position
      for (let i = 0; i < body.ids.length; i++) {
        const { error } = await supabase
          .from('wecom_board_columns')
          .update({ position: i })
          .eq('id', body.ids[i]);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    // 重新命名（需要 id）
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    const { name } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: '名稱不可為空' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wecom_board_columns')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error patching column:', error);
    return NextResponse.json({ error: 'Failed to patch column' }, { status: 500 });
  }
}
