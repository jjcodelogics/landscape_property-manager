import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeErrorMessage } from '@/lib/validation';
import { checkRateLimit, rateLimitExceeded, getRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.success) {
    return rateLimitExceeded(rateLimitResult);
  }

  try {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, zones(id, title, type, area_m2)')
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

  const zoneStatsMap: Record<string, { zone_name: string; area_m2: number | null; total_minutes: number; task_count: number; durations: number[] }> = {};
  
  for (const task of tasks || []) {
    const zoneId = task.zone_id;
    const zoneName = task.zones?.title || 'Unknown';
    const area_m2 = task.zones?.area_m2 ?? null;
    
    if (!zoneStatsMap[zoneId]) {
      zoneStatsMap[zoneId] = { zone_name: zoneName, area_m2, total_minutes: 0, task_count: 0, durations: [] };
    }
    
    zoneStatsMap[zoneId].total_minutes += task.duration_minutes;
    zoneStatsMap[zoneId].task_count += 1;
    zoneStatsMap[zoneId].durations.push(task.duration_minutes);
  }

  const zoneStats = Object.entries(zoneStatsMap).map(([zone_id, stats]) => ({
    zone_id,
    zone_name: stats.zone_name,
    area_m2: stats.area_m2,
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

  // KPI: time per m²
  const timePerM2ByZone = Object.entries(zoneStatsMap)
    .filter(([, stats]) => stats.area_m2 && stats.area_m2 > 0)
    .map(([zone_id, stats]) => ({
      zone_id,
      zone_name: stats.zone_name,
      area_m2: stats.area_m2 as number,
      minutes_per_m2: stats.task_count > 0
        ? parseFloat((stats.total_minutes / stats.task_count / (stats.area_m2 as number)).toFixed(4))
        : 0,
    }));

  // KPI: productive vs non-productive ratio
  const totalProductive = (tasks || []).reduce((sum, t) => sum + (t.productive_minutes || 0), 0);
  const totalNonProductive = (tasks || []).reduce((sum, t) => sum + (t.non_productive_minutes || 0), 0);
  const productiveRatio = {
    productive_minutes: totalProductive,
    non_productive_minutes: totalNonProductive,
    ratio: (totalProductive + totalNonProductive) > 0
      ? parseFloat((totalProductive / (totalProductive + totalNonProductive)).toFixed(3))
      : 0,
  };

  // KPI: variance per zone
  const varianceByZone = Object.entries(zoneStatsMap)
    .filter(([, stats]) => stats.task_count > 1)
    .map(([zone_id, stats]) => {
      const avg = stats.total_minutes / stats.task_count;
      const variance = stats.durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / stats.task_count;
      return {
        zone_id,
        zone_name: stats.zone_name,
        avg_minutes: Math.round(avg),
        variance: Math.round(variance),
        std_dev: Math.round(Math.sqrt(variance)),
      };
    });

    return NextResponse.json(
      {
        zoneStats,
        weeklyTotal,
        recentTasks: (tasks || []).slice(0, 10),
        kpi: { timePerM2ByZone, productiveRatio, varianceByZone },
      },
      {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          'Cache-Control': 'private, max-age=120, stale-while-revalidate=240',
        },
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
