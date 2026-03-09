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

    // 刪除該 parent_msg_id 或 msg_id 的所有訊息
    const { error } = await supabase
      .from('wecom_messages')
      .delete()
      .eq('parent_msg_id', id);

    if (error) throw error;

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

    // 更新該 parent_msg_id 下所有訊息的 column_id
    const { error } = await supabase
      .from('wecom_messages')
      .update({ column_id })
      .eq('parent_msg_id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, column_id });
  } catch (error) {
    console.error('Error moving card:', error);
    return NextResponse.json({ error: 'Failed to move card' }, { status: 500 });
  }
}
