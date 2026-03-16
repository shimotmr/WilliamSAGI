// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KNOWN_AGENTS = [
  { name: 'main',       display: 'Travis',  role: 'Manager · Sonnet 4.6',        emoji: '🤖' },
  { name: 'coder',      display: 'Blake',   role: 'Builder · GPT-5.4 Codex',     emoji: '🔨' },
  { name: 'researcher', display: 'Rex',     role: 'Thinker · Grok 4.20',         emoji: '🧠' },
  { name: 'secretary',  display: 'Oscar',   role: 'Operator · Qwen3 8B',         emoji: '📋' },
  { name: 'trader',     display: 'Warren',  role: 'Trader · MiniMax M2.5',       emoji: '📈' },
  { name: 'inspector',  display: 'Griffin', role: 'Guardian · Qwen3 8B',         emoji: '🛡️' },
];

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch from agents table
    const { data: agentsData } = await supabase
      .from('agents')
      .select('id, name, color, emoji, role, status')
      .order('name');

    // Fetch task stats per agent
    const { data: tasks } = await supabase
      .from('board_tasks')
      .select('assignee, status, completed_at')
      .neq('assignee', '待分配');

    // Normalize assignee aliases to canonical agent names
    const ALIAS_MAP: Record<string, string> = {
      'travis': 'main', 'main': 'main',
      'blake': 'coder', 'coder': 'coder', 'coder-b': 'coder',
      'rex': 'researcher', 'researcher': 'researcher',
      'oscar': 'secretary', 'secretary': 'secretary',
      'warren': 'trader', 'trader': 'trader',
      'griffin': 'inspector', 'inspector': 'inspector',
    };

    const taskStats: Record<string, { total: number; completed: number; running: number; pending: number }> = {};
    for (const t of (tasks || [])) {
      const raw = (t.assignee || '').toLowerCase();
      const key = ALIAS_MAP[raw] || raw;
      if (!taskStats[key]) taskStats[key] = { total: 0, completed: 0, running: 0, pending: 0 };
      taskStats[key].total++;
      if (t.status === '已完成') taskStats[key].completed++;
      else if (t.status === '執行中') taskStats[key].running++;
      else if (t.status === '待派發' || t.status === '待執行') taskStats[key].pending++;
    }

    // Build agent list: merge DB data with known agents
    const knownNames = KNOWN_AGENTS.map(a => a.name);

    const agents = KNOWN_AGENTS.map(known => {
      const dbAgent = (agentsData || []).find(
        a => a.name?.toLowerCase() === known.name.toLowerCase()
      );
      const stats = taskStats[known.name] || taskStats[known.display?.toLowerCase()] || { total: 0, completed: 0, running: 0, pending: 0 };
      const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        name: dbAgent?.name || known.display,
        display: known.display,
        role: dbAgent?.role || known.role,
        emoji: dbAgent?.emoji || known.emoji,
        color: dbAgent?.color || '#5E6AD2',
        status: dbAgent?.status || 'active',
        isActive: dbAgent?.status === 'active',
        tasksCompleted: stats.completed,
        tasksRunning: stats.running,
        tasksPending: stats.pending,
        tasksTotal: stats.total,
        successRate,
      };
    });

    return NextResponse.json({ agents, total: agents.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, agents: [] },
      { status: 500 }
    );
  }
}
