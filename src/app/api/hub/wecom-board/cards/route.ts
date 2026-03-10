import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 讀取所有卡片（按 parent_msg_id 分組）
export async function GET() {
  try {
    // 讀取所有訊息
    const { data: messages, error } = await supabase
      .from('wecom_messages')
      .select('*')
      .order('send_time', { ascending: true });

    if (error) throw error;

    // 按 parent_msg_id 分組
    const groupedCards: Record<string, {
      id: string;
      column_id: number;
      sender_name: string;
      preview: string;
      message_count: number;
      created_at: string;
      messages: Array<{
        id: number;
        sender_name: string;
        content: string;
        send_time: number;
      }>;
    }> = {};

    for (const msg of messages || []) {
      const parentId = msg.parent_msg_id || `single-${msg.id}`;

      if (!groupedCards[parentId]) {
        groupedCards[parentId] = {
          id: parentId,
          column_id: msg.column_id || 1,
          sender_name: msg.sender_name || '未知',
          preview: msg.content?.slice(0, 100) || '',
          message_count: 0,
          created_at: msg.created_at || new Date().toISOString(),
          messages: [],
        };
      }

      groupedCards[parentId].messages.push({
        id: msg.id,
        sender_name: msg.sender_name || '未知',
        content: msg.content || '',
        send_time: msg.send_time,
      });
      groupedCards[parentId].message_count++;
    }

    // 轉成陣列
    const cards = Object.values(groupedCards);
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 });
  }
}
