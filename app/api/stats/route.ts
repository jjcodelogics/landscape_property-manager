import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeErrorMessage } from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, zones(id, title, type)')
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Database error:', tasksError);
      return NextResponse.json(
        { error: sanitizeErrorMessage(tasksError) },
        { 
          status: 500,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

  const zoneStatsMap: Record<string, { zone_name: string; total_minutes: number; task_count: number }> = {};
  
  for (const task of tasks || []) {
    const zoneId = task.zone_id;
    const zoneName = task.zones?.title || 'Unknown';
    
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

    return NextResponse.json(
      {
        zoneStats,
        weeklyTotal,
        recentTasks: (tasks || []).slice(0, 10),
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: sanitizeErrorMessage(error) },
      { 
        status: 500,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
}
