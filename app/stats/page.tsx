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
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load statistics');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Statistics</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            This Week
          </h2>
          <div className="text-4xl font-bold text-gray-900">
            {formatMinutes(stats?.weeklyTotal || 0)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Total time logged in last 7 days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Time Per Zone
            </h2>
          </div>
          {stats?.zoneStats && stats.zoneStats.length > 0 ? (
            <ul className="divide-y">
              {stats.zoneStats.map((zs) => (
                <li key={zs.zone_id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{zs.zone_name}</p>
                      <p className="text-sm text-gray-500">
                        {zs.task_count} task{zs.task_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatMinutes(zs.total_minutes)}
                      </p>
                      <p className="text-sm text-gray-500">
                        avg {formatMinutes(zs.avg_minutes)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-gray-400 italic">
              No tasks logged yet.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Recent Activity
            </h2>
          </div>
          {stats?.recentTasks && stats.recentTasks.length > 0 ? (
            <ul className="divide-y">
              {stats.recentTasks.map((task) => (
                <li key={task.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {(task as TaskWithZone & { zones?: { name: string } }).zones?.name || 'Unknown Zone'}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {task.task_type.replace('_', ' ')}
                        {task.notes && ` · ${task.notes}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-medium text-gray-900">
                        {formatMinutes(task.duration_minutes)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-gray-400 italic">
              No recent activity.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
