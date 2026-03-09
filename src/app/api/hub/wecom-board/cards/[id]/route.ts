import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - 刪除卡片
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 刪除所有子訊息（parent_msg_id = id）
    const { error: e1 } = await supabase
      .from('wecom_messages')
      .delete()
      .eq('parent_msg_id', id);

    // 刪除根訊息（msg_id = id，parent_msg_id is null）
    const { error: e2 } = await supabase
      .from('wecom_messages')
      .delete()
      .eq('msg_id', id)
      .is('parent_msg_id', null);

    if (e1) throw e1;
    if (e2) throw e2;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}

// PATCH - 移動卡片（更新 column_id）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { column_id } = body;

    if (!column_id || typeof column_id !== 'number') {
      return NextResponse.json({ error: 'column_id 為必填' }, { status: 400 });
    }

    // 更新：主訊息（msg_id = id）+ 子訊息（parent_msg_id = id）
    const { error: e1 } = await supabase
      .from('wecom_messages')
      .update({ column_id })
      .eq('msg_id', id);

    const { error: e2 } = await supabase
      .from('wecom_messages')
      .update({ column_id })
      .eq('parent_msg_id', id);

    if (e1 && e2) throw e1;

    return NextResponse.json({ success: true, column_id });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}
