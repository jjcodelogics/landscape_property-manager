'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Trash2, Route, CheckSquare, Square } from 'lucide-react';
import { Point, Route as RouteType } from '@/lib/types';

const POINT_TYPE_LABELS: Record<string, string> = {
  trash_bin: '🗑️ Afvalbak',
  asset: '📦 Materieel',
  other: '📍 Overig',
};

export default function RoutesPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [loading, setLoading] = useState(true);

  // New point form
  const [showPointForm, setShowPointForm] = useState(false);
  const [pointTitle, setPointTitle] = useState('');
  const [pointType, setPointType] = useState<'trash_bin' | 'asset' | 'other'>('trash_bin');
  const [pointNotes, setPointNotes] = useState('');
  const [savingPoint, setSavingPoint] = useState(false);
  const [pointError, setPointError] = useState<string | null>(null);

  // New route form
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeTitle, setRouteTitle] = useState('');
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([]);
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([fetch('/api/points'), fetch('/api/routes')]);
      if (pRes.ok) setPoints(await pRes.json());
      if (rRes.ok) setRoutes(await rRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSavePoint = async () => {
    if (!pointTitle.trim()) { setPointError('Title is required'); return; }
    setSavingPoint(true);
    setPointError(null);
    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pointTitle,
          type: pointType,
          notes: pointNotes.trim() || null,
          // Minimal GeoJSON point - location can be set to a default
          geojson: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setPointTitle('');
      setPointNotes('');
      setShowPointForm(false);
      await loadData();
    } catch (err) {
      setPointError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingPoint(false);
    }
  };

  const handleSaveRoute = async () => {
    if (!routeTitle.trim()) { setRouteError('Route title is required'); return; }
    setSavingRoute(true);
    setRouteError(null);
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: routeTitle, point_ids: selectedPointIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setRouteTitle('');
      setSelectedPointIds([]);
      setShowRouteForm(false);
      await loadData();
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSavingRoute(false);
    }
  };

  const handleDeletePoint = async (id: string) => {
    setDeletingId(id);
    try { await fetch(`/api/points/${id}`, { method: 'DELETE' }); await loadData(); }
    finally { setDeletingId(null); }
  };

  const handleDeleteRoute = async (id: string) => {
    setDeletingId(id);
    try { await fetch(`/api/routes/${id}`, { method: 'DELETE' }); await loadData(); }
    finally { setDeletingId(null); }
  };

  const togglePoint = (id: string) => {
    setSelectedPointIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
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
          className="p-2 rounded-full touch-manipulation"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Punten & Routes</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Points section */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Markerpunten
              </h2>
            </div>
            <button
              onClick={() => setShowPointForm(!showPointForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: 'var(--color-secondary)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Punt Toevoegen
            </button>
          </div>

          {showPointForm && (
            <div className="p-5 space-y-3" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Titel *</label>
                <input value={pointTitle} onChange={(e) => setPointTitle(e.target.value)} className="input" placeholder="bijv. Bak A1" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['trash_bin', 'asset', 'other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPointType(t)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all touch-manipulation ${
                        pointType === t
                          ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {POINT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Notities</label>
                <textarea value={pointNotes} onChange={(e) => setPointNotes(e.target.value)} className="input resize-none" rows={2} placeholder="Optionele notities…" />
              </div>
              {pointError && <p className="text-[var(--color-danger)] text-sm">{pointError}</p>}
              <div className="flex gap-2">
                <button onClick={handleSavePoint} disabled={savingPoint} className="btn btn-primary flex-1 text-sm disabled:opacity-50">
                  {savingPoint ? 'Opslaan…' : 'Punt Opslaan'}
                </button>
                <button onClick={() => setShowPointForm(false)} className="btn btn-ghost text-sm">Annuleren</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">Laden…</div>
          ) : points.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-light)]" />
              <p className="text-[var(--color-text-light)] italic text-sm">Nog geen punten.</p>
            </div>
          ) : (
            <ul>
              {points.map((point, idx) => (
                <li
                  key={point.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: idx < points.length - 1 ? '1px solid var(--color-border)' : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-text)] text-sm truncate">{point.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{POINT_TYPE_LABELS[point.type]}</p>
                    {point.notes && <p className="text-xs text-[var(--color-text-light)] mt-0.5 truncate">{point.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDeletePoint(point.id)}
                    disabled={deletingId === point.id}
                    className="p-2 rounded-lg touch-manipulation disabled:opacity-50"
                    style={{ color: 'var(--color-danger)' }}
                    aria-label={`Verwijder ${point.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Routes section */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
          >
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[var(--color-secondary)]" />
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Routes
              </h2>
            </div>
            <button
              onClick={() => setShowRouteForm(!showRouteForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ background: 'var(--color-secondary)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Nieuwe Route
            </button>
          </div>

          {showRouteForm && (
            <div className="p-5 space-y-3" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Routenaam *</label>
                <input value={routeTitle} onChange={(e) => setRouteTitle(e.target.value)} className="input" placeholder="bijv. Noord Vleugel Bakken" />
              </div>
              {points.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">Selecteer Punten</label>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {points.map((p) => {
                      const sel = selectedPointIds.includes(p.id);
                      return (
                        <li
                          key={p.id}
                          onClick={() => togglePoint(p.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border-2 transition-all touch-manipulation ${
                            sel ? 'border-[var(--color-secondary)] bg-[rgba(10,147,150,0.06)]' : 'border-[var(--color-border)]'
                          }`}
                        >
                          {sel ? <CheckSquare className="w-4 h-4 text-[var(--color-secondary)]" /> : <Square className="w-4 h-4 text-[var(--color-text-light)]" />}
                          <span className="text-sm font-medium text-[var(--color-text)]">{p.title}</span>
                          <span className="text-xs text-[var(--color-text-muted)] ml-auto">{POINT_TYPE_LABELS[p.type]}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {routeError && <p className="text-[var(--color-danger)] text-sm">{routeError}</p>}
              <div className="flex gap-2">
                <button onClick={handleSaveRoute} disabled={savingRoute} className="btn btn-primary flex-1 text-sm disabled:opacity-50">
                  {savingRoute ? 'Opslaan…' : 'Route Opslaan'}
                </button>
                <button onClick={() => setShowRouteForm(false)} className="btn btn-ghost text-sm">Annuleren</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">Laden…</div>
          ) : routes.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Route className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-light)]" />
              <p className="text-[var(--color-text-light)] italic text-sm">Nog geen routes. Maak er één door punten te groeperen.</p>
            </div>
          ) : (
            <ul>
              {routes.map((route, idx) => {
                const routePoints = points.filter((p) => route.point_ids.includes(p.id));
                return (
                  <li
                    key={route.id}
                    className="px-5 py-3.5"
                    style={{ borderBottom: idx < routes.length - 1 ? '1px solid var(--color-border)' : undefined }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--color-text)] text-sm">{route.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mb-1.5">
                          {route.point_ids.length} punt{route.point_ids.length !== 1 ? 'en' : ''}
                        </p>
                        {routePoints.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {routePoints.map((p) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: 'rgba(0,95,115,0.1)', color: 'var(--color-primary)' }}
                              >
                                {p.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        disabled={deletingId === route.id}
                        className="p-2 rounded-lg touch-manipulation disabled:opacity-50 flex-shrink-0"
                        style={{ color: 'var(--color-danger)' }}
                        aria-label={`Verwijder ${route.title}`}
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
