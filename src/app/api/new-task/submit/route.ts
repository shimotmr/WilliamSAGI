// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, answers, priority } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '缺少任務描述' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: '伺服器配置錯誤' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare answers as JSON string
    const descriptionJson = JSON.stringify(answers || {});

    // Insert into board_tasks
    const { data, error } = await supabase
      .from('board_tasks')
      .insert({
        title: description.slice(0, 100),
        description: descriptionJson,
        priority: priority || 'P2',
        assignee: 'travis',
        board: 'agent',
        status: '待執行',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      status: 'ok',
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
