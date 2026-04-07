'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4\">
        <div className="text-center\">
          <div className=\"text-4xl mb-3\">📊</div>
          <p className="text-gray-600 font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4\">
        <div className="text-center max-w-md\">
          <div className=\"text-4xl mb-3\">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe\">
      {/* Mobile-optimized header */}
      <div className="bg-white border-b px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm safe-top\">
        <Link
          href="/"
          className="p-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </Link>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Statistics</h1>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6\">
        {/* Weekly total card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border\">
          <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide mb-3\">
            This Week
          </h2>
          <div className="text-3xl sm:text-4xl font-bold text-gray-900\">
            {formatMinutes(stats?.weeklyTotal || 0)}
          </div>
          <p className="text-sm text-gray-600 mt-2">Total time logged in last 7 days</p>
        </div>

        {/* Time per zone */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden\">
          <div className="px-4 sm:px-5 py-4 border-b bg-gray-50\">
            <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide\">
              Time Per Zone
            </h2>
          </div>
          {stats?.zoneStats && stats.zoneStats.length > 0 ? (
            <ul className="divide-y\">
              {stats.zoneStats.map((zs) => (
                <li key={zs.zone_id} className="px-4 sm:px-5 py-4 active:bg-gray-50 transition-colors\">
                  <div className="flex items-center justify-between gap-3\">
                    <div className="min-w-0 flex-1\">
                      <p className="font-semibold text-gray-900 truncate text-base">{zs.zone_name}</p>
                      <p className="text-sm text-gray-600 mt-0.5\">
                        {zs.task_count} task{zs.task_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0\">
                      <p className="font-bold text-gray-900 text-base\">
                        {formatMinutes(zs.total_minutes)}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5\">
                        Avg {formatMinutes(zs.avg_minutes)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 sm:px-5 py-10 text-center text-gray-400 italic text-sm\">
              No tasks logged yet.
            </p>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden\">
          <div className="px-4 sm:px-5 py-4 border-b bg-gray-50\">
            <h2 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide\">
              Recent Activity
            </h2>
          </div>
          {stats?.recentTasks && stats.recentTasks.length > 0 ? (
            <ul className="divide-y\">
              {stats.recentTasks.map((task) => (
                <li key={task.id} className="px-4 sm:px-5 py-4 active:bg-gray-50 transition-colors\">
                  <div className="flex items-start justify-between gap-3\">
                    <div className="min-w-0 flex-1\">
                      <p className="font-semibold text-gray-900 truncate text-base\">
                        {task.zones?.name || 'Unknown Zone'}
                      </p>
                      <p className="text-sm text-gray-600 capitalize mt-0.5\">
                        {task.task_type.replace('_', ' ')}
                        {task.notes && ` · ${task.notes}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0\">
                      <p className="font-bold text-gray-900 text-base\">
                        {formatMinutes(task.duration_minutes)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5\">
                        {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 sm:px-5 py-10 text-center text-gray-400 italic text-sm\">
              No recent activity.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
