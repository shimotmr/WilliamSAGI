// System Health Status API
// Returns aggregated health data: faults, repairs, stuck tasks

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d'; // 1d, 7d, 30d

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 1. Faults - Tasks with failure reasons
    const { data: faultTasks, error: faultError } = await supabase
      .from('board_tasks')
      .select('id, title, status, last_failure_reason, updated_at, assignee, retry_count')
      .not('last_failure_reason', 'is', null)
      .gte('updated_at', startDate.toISOString())
      .order('updated_at', { ascending: false });

    if (faultError) throw faultError;

    // 2. Stuck tasks - Tasks in '執行中' for too long (updated_at > 30 minutes ago)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const { data: stuckTasks, error: stuckError } = await supabase
      .from('board_tasks')
      .select('id, title, status, updated_at, assignee, dispatch_model')
      .eq('status', '執行中')
      .lt('updated_at', thirtyMinutesAgo.toISOString())
      .order('updated_at', { ascending: true });

    if (stuckError) throw stuckError;

    // 3. Repairs - Tasks that were fixed (fix_verified_at is not null)
    const { data: repairedTasks, error: repairError } = await supabase
      .from('board_tasks')
      .select('id, title, status, fix_verified_at, fix_verified_result, updated_at, assignee')
      .not('fix_verified_at', 'is', null)
      .gte('fix_verified_at', startDate.toISOString())
      .order('fix_verified_at', { ascending: false });

    if (repairError) throw repairError;

    // 4. Summary stats
    const summary = {
      totalFaults: faultTasks?.length || 0,
      totalStuck: stuckTasks?.length || 0,
      totalRepaired: repairedTasks?.length || 0,
      byAssignee: {} as Record<string, { faults: number; stuck: number; repaired: number }>,
    };

    // Aggregate by assignee
    const allTasks = [...(faultTasks || []), ...(stuckTasks || []), ...(repairedTasks || [])];
    allTasks.forEach((task: any) => {
      const assignee = task.assignee || 'unassigned';
      if (!summary.byAssignee[assignee]) {
        summary.byAssignee[assignee] = { faults: 0, stuck: 0, repaired: 0 };
      }
    });

    faultTasks?.forEach((task: any) => {
      const assignee = task.assignee || 'unassigned';
      summary.byAssignee[assignee].faults++;
    });

    stuckTasks?.forEach((task: any) => {
      const assignee = task.assignee || 'unassigned';
      summary.byAssignee[assignee].stuck++;
    });

    repairedTasks?.forEach((task: any) => {
      const assignee = task.assignee || 'unassigned';
      summary.byAssignee[assignee].repaired++;
    });

    // 5. Health score (0-100)
    const healthScore = Math.max(0, 100 - (summary.totalStuck * 10) - (summary.totalFaults * 5) + (summary.totalRepaired * 3));

    return NextResponse.json({
      ok: true,
      range,
      timestamp: now.toISOString(),
      healthScore,
      summary,
      faults: faultTasks || [],
      stuck: stuckTasks || [],
      repairs: repairedTasks || [],
    });
  } catch (error: any) {
    console.error('Health status API error:', error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
