import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*, zones(id, name, type)')
    .order('created_at', { ascending: false });

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const zoneStatsMap: Record<string, { zone_name: string; total_minutes: number; task_count: number }> = {};
  
  for (const task of tasks || []) {
    const zoneId = task.zone_id;
    const zoneName = task.zones?.name || 'Unknown';
    
    if (!zoneStatsMap[zoneId]) {
      zoneStatsMap[zoneId] = { zone_name: zoneName, total_minutes: 0, task_count: 0 };
    }
    
    zoneStatsMap[zoneId].total_minutes += task.duration_minutes;
    zoneStatsMap[zoneId].task_count += 1;
  }

  const zoneStats = Object.entries(zoneStatsMap).map(([zone_id, stats]) => ({
    zone_id,
    zone_name: stats.zone_name,
    total_minutes: stats.total_minutes,
    avg_minutes: stats.task_count > 0 ? Math.round(stats.total_minutes / stats.task_count) : 0,
    task_count: stats.task_count,
  }));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weeklyTasks = (tasks || []).filter(
    (t) => new Date(t.created_at) >= oneWeekAgo
  );
  
  const weeklyTotal = weeklyTasks.reduce((sum, t) => sum + t.duration_minutes, 0);

  return NextResponse.json({
    zoneStats,
    weeklyTotal,
    recentTasks: (tasks || []).slice(0, 10),
  });
}
