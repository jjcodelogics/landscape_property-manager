'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Users, Clock, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { Zone, DailyPlan, ZoneStats } from '@/lib/types';

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function PlanPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [planDate, setPlanDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState(1);
  const [hoursPerMember, setHoursPerMember] = useState(8);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [zonesRes, plansRes, statsRes] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/plans'),
        fetch('/api/stats'),
      ]);
      if (zonesRes.ok) setZones(await zonesRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
      if (statsRes.ok) {
        const data = await statsRes.json();
        setZoneStats(data.zoneStats || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleZone = (id: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  const getAvgMinutes = (zoneId: string): number => {
    const stat = zoneStats.find((s) => s.zone_id === zoneId);
    return stat?.avg_minutes ?? 0;
  };

  const totalEstimatedMins = selectedZoneIds.reduce((sum, id) => sum + getAvgMinutes(id), 0);
  const totalAvailableMins = teamMembers * hoursPerMember * 60;
  const coveragePct = totalAvailableMins > 0
    ? Math.min(100, Math.round((totalEstimatedMins / totalAvailableMins) * 100))
    : 0;

  const handleSave = async () => {
    if (selectedZoneIds.length === 0) {
      setError('Selecteer minimaal één zone');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_date: planDate,
          zone_ids: selectedZoneIds,
          team_members: teamMembers,
          hours_per_member: hoursPerMember,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Mislukt om plan op te slaan');
      }
      setSelectedZoneIds([]);
      setNotes('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const ZONE_TYPE_BADGE: Record<string, string> = {
    grass: 'badge-grass',
    waste: 'badge-waste',
    maintenance: 'badge-maintenance',
  };

  return (
    <div className="min-h-screen pb-safe" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 safe-top"
        style={{ background: 'var(--color-primary)', boxShadow: '0 2px 12px rgba(0,95,115,0.25)' }}
      >
        <Link
          href="/"
          className="p-2 rounded-full touch-manipulation flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Terug naar kaart"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Dagplanning</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Create plan section */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Nieuw Plan
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Date + team */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                  Teamleden
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={teamMembers}
                  onChange={(e) => setTeamMembers(parseInt(e.target.value) || 1)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                  Uren/Persoon
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={hoursPerMember}
                  onChange={(e) => setHoursPerMember(parseFloat(e.target.value) || 8)}
                  className="input"
                />
              </div>
            </div>

            {/* Zone selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                Selecteer Zones
              </label>
              {loading ? (
                <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">Zones laden…</p>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {zones.map((zone) => {
                    const selected = selectedZoneIds.includes(zone.id);
                    const avg = getAvgMinutes(zone.id);
                    return (
                      <li
                        key={zone.id}
                        onClick={() => toggleZone(zone.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border-2 transition-all touch-manipulation ${
                          selected
                            ? 'border-[var(--color-secondary)] bg-[rgba(10,147,150,0.06)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                      >
                        {selected ? (
                          <CheckSquare className="w-4 h-4 flex-shrink-0 text-[var(--color-secondary)]" />
                        ) : (
                          <Square className="w-4 h-4 flex-shrink-0 text-[var(--color-text-light)]" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-text)] text-sm truncate">{zone.title}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold mt-0.5 ${ZONE_TYPE_BADGE[zone.type]}`}>
                            {zone.type}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {avg > 0 ? (
                            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                              ~{formatMinutes(avg)}
                            </p>
                          ) : (
                            <p className="text-xs text-[var(--color-text-light)]">geen data</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Capacity summary */}
            {selectedZoneIds.length > 0 && (
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  Werklastverdeling
                </p>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p className="text-[var(--color-text-muted)] text-xs">Geschat</p>
                    <p className="font-bold text-[var(--color-text)]">{formatMinutes(totalEstimatedMins)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)] text-xs">Beschikbaar</p>
                    <p className="font-bold text-[var(--color-text)]">{formatMinutes(totalAvailableMins)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-muted)] text-xs">Dekking</p>
                    <p className={`font-bold ${coveragePct > 100 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                      {coveragePct}%
                    </p>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, coveragePct)}%`,
                      background: coveragePct > 100 ? 'var(--color-danger)' : 'var(--color-secondary)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                Notities <span className="normal-case font-normal text-[var(--color-text-light)]">(optioneel)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none"
                rows={2}
                placeholder="Eventuele notities voor deze dag…"
              />
            </div>

            {error && (
              <p className="text-[var(--color-danger)] text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Opslaan…' : 'Plan Opslaan'}
            </button>
          </div>
        </div>

        {/* Saved plans */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
              Opgeslagen Plannen
            </h2>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-[var(--color-text-muted)] text-sm">Laden…</div>
          ) : plans.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-light)]" />
              <p className="text-[var(--color-text-light)] italic text-sm">Nog geen plannen.</p>
            </div>
          ) : (
            <ul>
              {plans.map((plan, idx) => {
                const planZones = zones.filter((z) => plan.zone_ids.includes(z.id));
                const estimated = plan.zone_ids.reduce((sum, id) => sum + getAvgMinutes(id), 0);
                const available = plan.team_members * plan.hours_per_member * 60;
                return (
                  <li
                    key={plan.id}
                    className="px-5 py-4"
                    style={{ borderBottom: idx < plans.length - 1 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CalendarDays className="w-4 h-4 text-[var(--color-secondary)]" />
                          <p className="font-semibold text-[var(--color-text)]">{plan.plan_date}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
                          <Users className="w-3.5 h-3.5" />
                          <span>{plan.team_members} persoon{plan.team_members !== 1 ? 'personen' : ''} · {plan.hours_per_member}u elk</span>
                          <Clock className="w-3.5 h-3.5 ml-1" />
                          <span>{estimated > 0 ? formatMinutes(estimated) : '—'} geschat / {formatMinutes(available)} beschikb.</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {planZones.map((z) => (
                            <span key={z.id} className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ZONE_TYPE_BADGE[z.type]}`}>
                              {z.title}
                            </span>
                          ))}
                          {plan.zone_ids.length > planZones.length && (
                            <span className="text-xs text-[var(--color-text-muted)]">+{plan.zone_ids.length - planZones.length} meer</span>
                          )}
                        </div>
                        {plan.notes && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 italic">{plan.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        disabled={deletingId === plan.id}
                        className="p-2 rounded-lg transition-colors touch-manipulation disabled:opacity-50"
                        style={{ color: 'var(--color-danger)' }}
                        aria-label="Verwijder plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
