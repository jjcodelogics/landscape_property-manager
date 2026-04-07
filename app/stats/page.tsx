'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Leaf, AlertCircle, BarChart2 } from 'lucide-react';
import { ZoneStats, TaskWithZone } from '@/lib/types';

interface StatsData {
  zoneStats: ZoneStats[];
  weeklyTotal: number;
  recentTasks: TaskWithZone[];
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TASK_TYPE_BADGE: Record<string, string> = {
  mowing:      'badge-grass',
  waste:       'badge-waste',
  maintenance: 'badge-maintenance',
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load statistics. Check your Supabase configuration.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 text-[var(--color-secondary)]" />
          <p className="text-[var(--color-text-muted)] font-medium">Loading statistics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-[var(--color-danger)]" />
          <p className="text-[var(--color-danger)] font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-safe" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 safe-top"
        style={{
          background: 'var(--color-primary)',
          boxShadow: '0 2px 12px rgba(0,95,115,0.25)',
        }}
      >
        <Link
          href="/"
          className="p-2 rounded-full touch-manipulation flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Statistics</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Weekly total card */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            boxShadow: '0 4px 16px rgba(0,95,115,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Clock className="w-4 h-4" />
            <p className="text-xs font-bold uppercase tracking-wider">This Week</p>
          </div>
          <p className="text-4xl font-bold">{formatMinutes(stats?.weeklyTotal || 0)}</p>
          <p className="text-sm mt-1 opacity-75">Total time logged in last 7 days</p>
        </div>

        {/* Time per zone */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Time Per Zone
            </h2>
          </div>
          {stats?.zoneStats && stats.zoneStats.length > 0 ? (
            <ul>
              {stats.zoneStats.map((zs, idx) => {
                const maxMinutes = Math.max(...(stats.zoneStats.map((z) => z.total_minutes)));
                const pct = maxMinutes > 0 ? Math.round((zs.total_minutes / maxMinutes) * 100) : 0;
                const barColor = pct >= 80 ? 'var(--color-zone-grass)' : pct >= 40 ? 'var(--color-zone-maintenance)' : 'var(--color-zone-waste)';

                return (
                  <li
                    key={zs.zone_id}
                    className="px-5 py-4"
                    style={{ borderBottom: idx < stats.zoneStats.length - 1 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--color-text)] truncate">{zs.zone_name}</p>
                        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                          {zs.task_count} task{zs.task_count !== 1 ? 's' : ''} · avg {formatMinutes(zs.avg_minutes)}
                        </p>
                      </div>
                      <p className="font-bold text-[var(--color-text)] flex-shrink-0">{formatMinutes(zs.total_minutes)}</p>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: barColor }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <Leaf className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-light)]" />
              <p className="text-[var(--color-text-light)] italic text-sm">No tasks logged yet.</p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Recent Activity
            </h2>
          </div>
          {stats?.recentTasks && stats.recentTasks.length > 0 ? (
            <ul>
              {stats.recentTasks.map((task, idx) => (
                <li
                  key={task.id}
                  className="px-5 py-4"
                  style={{ borderBottom: idx < (stats.recentTasks.length - 1) ? '1px solid var(--color-border)' : undefined }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--color-text)] truncate">
                        {task.zones?.name || 'Unknown Zone'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TASK_TYPE_BADGE[task.task_type] || ''}`}>
                          {task.task_type.replace('_', ' ')}
                        </span>
                        {task.notes && (
                          <span className="text-xs text-[var(--color-text-muted)] truncate">{task.notes}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[var(--color-text)]">{formatMinutes(task.duration_minutes)}</p>
                      <p className="text-xs text-[var(--color-text-light)] mt-0.5">{formatDate(task.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-light)]" />
              <p className="text-[var(--color-text-light)] italic text-sm">No recent activity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

