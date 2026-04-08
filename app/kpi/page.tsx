'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, AlertCircle, BarChart2, Zap, Activity } from 'lucide-react';
import { KpiData, ZoneStats } from '@/lib/types';

interface StatsData {
  zoneStats: ZoneStats[];
  kpi: KpiData;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function KpiPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setError('Failed to load KPI data.'); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <BarChart2 className="w-10 h-10 text-[var(--color-secondary)] animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-[var(--color-danger)]" />
          <p className="text-[var(--color-danger)] font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const kpi = stats?.kpi;
  const hasProductiveData = (kpi?.productiveRatio.productive_minutes ?? 0) + (kpi?.productiveRatio.non_productive_minutes ?? 0) > 0;

  return (
    <div className="min-h-screen pb-safe" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 safe-top"
        style={{ background: 'var(--color-primary)', boxShadow: '0 2px 12px rgba(0,95,115,0.25)' }}
      >
        <Link
          href="/"
          className="p-2 rounded-full touch-manipulation"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Terug naar kaart"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">KPI & Analyses</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Productive vs Non-Productive */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Productieve vs Niet-Productieve Tijd
              </h2>
            </div>
          </div>
          {hasProductiveData ? (
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(10,147,150,0.08)' }}>
                  <p className="text-xs font-semibold text-[var(--color-secondary)] mb-1">⚡ Productief</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {formatMinutes(kpi!.productiveRatio.productive_minutes)}
                  </p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(214,158,46,0.08)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-warning)' }}>⏸ Niet-Productief</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {formatMinutes(kpi!.productiveRatio.non_productive_minutes)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.round(kpi!.productiveRatio.ratio * 100)}%`, background: 'var(--color-secondary)' }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--color-text)] flex-shrink-0">
                  {Math.round(kpi!.productiveRatio.ratio * 100)}% productive
                </span>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[var(--color-text-light)] italic text-sm">No timer data yet. Use the chess clock when logging tasks.</p>
            </div>
          )}
        </div>

        {/* Time per m² */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Time per m²
              </h2>
            </div>
          </div>
          {kpi && kpi.timePerM2ByZone.length > 0 ? (
            <ul>
              {kpi.timePerM2ByZone.map((item, idx) => (
                <li
                  key={item.zone_id}
                  className="px-5 py-3.5"
                  style={{ borderBottom: idx < kpi.timePerM2ByZone.length - 1 ? '1px solid var(--color-border)' : undefined }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--color-text)] text-sm truncate">{item.zone_name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.area_m2.toLocaleString()} m²</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[var(--color-text)] text-sm">{item.minutes_per_m2} min/m²</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[var(--color-text-light)] italic text-sm">Zones need area data and task logs to show this metric.</p>
            </div>
          )}
        </div>

        {/* Variance by zone */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Time Variance by Zone
              </h2>
            </div>
          </div>
          {kpi && kpi.varianceByZone.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                    <th className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">Zone</th>
                    <th className="px-5 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">Avg</th>
                    <th className="px-5 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">Std Dev</th>
                  </tr>
                </thead>
                <tbody>
                  {kpi.varianceByZone.map((item, idx) => (
                    <tr
                      key={item.zone_id}
                      style={{ borderBottom: idx < kpi.varianceByZone.length - 1 ? '1px solid var(--color-border)' : undefined }}
                    >
                      <td className="px-5 py-3 font-medium text-[var(--color-text)]">{item.zone_name}</td>
                      <td className="px-5 py-3 text-right text-[var(--color-text-muted)]">{formatMinutes(item.avg_minutes)}</td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`font-semibold ${item.std_dev > item.avg_minutes * 0.5 ? 'text-[var(--color-warning)]' : 'text-[var(--color-success)]'}`}
                        >
                          ±{formatMinutes(item.std_dev)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[var(--color-text-light)] italic text-sm">Need at least 2 task logs per zone to show variance.</p>
            </div>
          )}
        </div>

        {/* Average time per zone */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Average Time per Zone
              </h2>
            </div>
          </div>
          {stats?.zoneStats && stats.zoneStats.length > 0 ? (
            <ul>
              {stats.zoneStats.map((zs, idx) => {
                const maxAvg = Math.max(...stats.zoneStats.map((z) => z.avg_minutes));
                const pct = maxAvg > 0 ? Math.round((zs.avg_minutes / maxAvg) * 100) : 0;
                return (
                  <li
                    key={zs.zone_id}
                    className="px-5 py-4"
                    style={{ borderBottom: idx < stats.zoneStats.length - 1 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--color-text)] truncate text-sm">{zs.zone_name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {zs.task_count} log{zs.task_count !== 1 ? 's' : ''}
                          {zs.area_m2 ? ` · ${zs.area_m2.toLocaleString()} m²` : ''}
                        </p>
                      </div>
                      <p className="font-bold text-[var(--color-text)] text-sm flex-shrink-0">{formatMinutes(zs.avg_minutes)}</p>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'var(--color-secondary)' }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[var(--color-text-light)] italic text-sm">No task data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
