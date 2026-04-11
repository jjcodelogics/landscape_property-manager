'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Edit3, MapPin, PenSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { Zone, ZoneType, Point } from '@/lib/types';

const AdminMap = dynamic(() => import('@/components/AdminMap'), { ssr: false });

const INSTRUCTIONS_TEMPLATE = `## Taken

## Notities

## Belangrijke Informatie
- Oppervlakte (m²): 
- Toegang: 

## Contact
- Facilitair Manager: 
- Telefoon: 

## Kwaliteitsnormen
`;

interface ZoneFormData {
  title: string;
  type: ZoneType;
  instructions: string;
  tags: string[];
  last_worked_at: string;
  frequency: string;
}

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string; badge: string }[] = [
  { value: 'grass',       label: 'Grasonderhoud',       badge: 'badge-grass' },
  { value: 'maintenance', label: 'Onderhoud',  badge: 'badge-maintenance' },
];

const POINT_TYPE_LABELS: Record<string, string> = {
  trash_bin: '🗑️ Afvalbak',
  asset: '📦 Materieel',
  other: '📍 Overig',
};

interface PointFormData {
  title: string;
  type: 'trash_bin' | 'asset' | 'other';
  notes: string;
}

export default function AdminZonesPage() {
  // Mode toggle
  const [mode, setMode] = useState<'zone' | 'point'>('zone');
  
  // Zones state
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawnGeojson, setDrawnGeojson] = useState<GeoJSON.Feature | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ZoneFormData>({
    title: '',
    type: 'grass',
    instructions: '',
    tags: [],
    last_worked_at: '',
    frequency: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Points state
  const [points, setPoints] = useState<Point[]>([]);
  const [showPointForm, setShowPointForm] = useState(false);
  const [pointFormData, setPointFormData] = useState<PointFormData>({
    title: '',
    type: 'trash_bin',
    notes: '',
  });
  const [pointGeojson, setPointGeojson] = useState<GeoJSON.Feature | null>(null);
  const [savingPoint, setSavingPoint] = useState(false);
  const [pointError, setPointError] = useState<string | null>(null);

  const loadZones = async () => {
    try {
      const res = await fetch('/api/zones');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setZones(Array.isArray(data) ? data : []);
    } catch {
      // ignore — zones will remain empty
    } finally {
      setLoading(false);
    }
  };

  const loadPoints = async () => {
    try {
      const res = await fetch('/api/points');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPoints(Array.isArray(data) ? data : []);
    } catch {
      // ignore — points will remain empty
    }
  };

  useEffect(() => {
    loadZones();
    loadPoints();
  }, []);

  const handlePolygonDrawn = (geojson: GeoJSON.Feature) => {
    setDrawnGeojson(geojson);
    setShowForm(true);
    setEditingZone(null);
    setFormData({ 
      title: '', 
      type: 'grass', 
      instructions: INSTRUCTIONS_TEMPLATE,
      tags: [],
      last_worked_at: '',
      frequency: '',
    });
    setTagInput('');
  };

  const handleMarkerPlaced = (geojson: GeoJSON.Feature) => {
    setPointGeojson(geojson);
    setShowPointForm(true);
    setPointFormData({
      title: '',
      type: 'trash_bin',
      notes: '',
    });
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setDrawnGeojson(zone.geojson);
    setFormData({
      title: zone.title,
      type: zone.type,
      instructions: zone.instructions || '',
      tags: zone.tags || [],
      last_worked_at: zone.last_worked_at ? zone.last_worked_at.slice(0, 16) : '',
      frequency: zone.frequency || '',
    });
    setTagInput('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Zonetitel is verplicht');
      return;
    }
    if (!drawnGeojson) {
      setError('Teken een polygoon op de kaart');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingZone ? `/api/zones/${editingZone.id}` : '/api/zones';
      const method = editingZone ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, geojson: drawnGeojson }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Mislukt om zone op te slaan');
      }

      await loadZones();
      setShowForm(false);
      setDrawnGeojson(null);
      setEditingZone(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Deze zone verwijderen? Dit verwijdert ook alle bijbehorende taken.')) return;
    setDeletingId(zoneId);

    try {
      const res = await fetch(`/api/zones/${zoneId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(data.error || `HTTP ${res.status}: Failed to delete zone`);
      }
      await loadZones();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mislukt om zone te verwijderen';
      alert(`Fout bij verwijderen: ${errorMessage}`);
      console.error('Delete zone error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSavePoint = async () => {
    if (!pointFormData.title.trim()) {
      setPointError('Titel is verplicht');
      return;
    }
    if (!pointGeojson) {
      setPointError('Plaats een markering op de kaart');
      return;
    }

    setSavingPoint(true);
    setPointError(null);

    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pointFormData, geojson: pointGeojson }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Mislukt om punt op te slaan');
      }

      await loadPoints();
      setShowPointForm(false);
      setPointGeojson(null);
    } catch (err) {
      setPointError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setSavingPoint(false);
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!confirm('Dit punt verwijderen?')) return;
    setDeletingId(pointId);

    try {
      const res = await fetch(`/api/points/${pointId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Mislukt om te verwijderen');
      await loadPoints();
    } catch {
      alert('Mislukt om punt te verwijderen');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-safe" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 safe-top"
        style={{
          background: 'var(--color-primary)',
          boxShadow: '0 2px 12px rgba(0,95,115,0.25)',
        }}
      >
        <Link
          href="/"
          className="p-2 rounded-full touch-manipulation flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          aria-label="Terug naar kaart"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Beheer</h1>
        
        {/* Mode toggle */}
        <button
          onClick={() => setMode(mode === 'zone' ? 'point' : 'zone')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all touch-manipulation"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          {mode === 'zone' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
          {mode === 'zone' ? 'Zones' : 'Punten'}
        </button>
        
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <MapPin className="w-3.5 h-3.5" />
          {mode === 'zone' ? `${zones.length} zone${zones.length !== 1 ? 's' : ''}` : `${points.length} punt${points.length > 1 ? 'en' : ''}`}
        </div>
      </div>

      {/* Instructions banner when no form is showing */}
      {!showForm && !showPointForm && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
          <p className="text-sm text-blue-900">
            {mode === 'zone' ? (
              <><span className="font-semibold">💡 Om een nieuwe zone toe te voegen:</span> Gebruik de tekengereedschappen linksboven op de kaart (polygoon of rechthoek icoon) om een zone te tekenen, en vul vervolgens de details in.</>
            ) : (
              <><span className="font-semibold">📍 Om een nieuw punt toe te voegen:</span> Klik op het markering icoon linksboven op de kaart, plaats de markering op de gewenste locatie, en vul vervolgens de details in.</>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative h-64 sm:h-80 lg:h-auto lg:flex-1">
          <AdminMap
            zones={zones}
            points={points}
            onPolygonDrawn={handlePolygonDrawn}
            editingGeojson={editingZone ? editingZone.geojson : null}
            onMarkerPlaced={handleMarkerPlaced}
            enableMarker={mode === 'point'}
          />
        </div>

        {/* Sidebar */}
        <div
          className="w-full lg:w-96 flex-1 lg:flex-none overflow-y-auto"
          style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
        >
          {/* Zone form */}
          {showForm && (
            <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <PenSquare className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="font-bold text-[var(--color-text)]">
                  {editingZone ? 'Zone Bewerken' : 'Nieuwe Zone'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((p: ZoneFormData) => ({ ...p, title: e.target.value }))}
                    className="input"
                    placeholder="bijv. Noord Gazon"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Zonetype
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ZONE_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData((p: ZoneFormData) => ({ ...p, type: opt.value }))}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 touch-manipulation ${
                          formData.type === opt.value
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Instructies{' '}
                    <span className="normal-case font-normal text-[var(--color-text-light)]">(Markdown ondersteund)</span>
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData((p: ZoneFormData) => ({ ...p, instructions: e.target.value }))}
                    className="input resize-none"
                    placeholder={INSTRUCTIONS_TEMPLATE}
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Tags <span className="normal-case font-normal text-[var(--color-text-light)]">(optioneel)</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
                          if (tag && !formData.tags.includes(tag)) {
                            setFormData((p: ZoneFormData) => ({ ...p, tags: [...p.tags, tag] }));
                          }
                          setTagInput('');
                        }
                      }}
                      className="input flex-1"
                      placeholder="Tag toevoegen, druk op Enter"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
                        if (tag && !formData.tags.includes(tag)) {
                          setFormData((p: ZoneFormData) => ({ ...p, tags: [...p.tags, tag] }));
                        }
                        setTagInput('');
                      }}
                      className="btn btn-ghost text-sm px-3"
                    >
                      Toevoegen
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer"
                          style={{ background: 'rgba(10,147,150,0.12)', color: 'var(--color-secondary)' }}
                          onClick={() => setFormData((p: ZoneFormData) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))}
                          title="Klik om te verwijderen"
                        >
                          #{tag} ×
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                      Laatst Bewerkt Op
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.last_worked_at}
                      onChange={(e) => setFormData((p: ZoneFormData) => ({ ...p, last_worked_at: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                      Frequentie
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData((p: ZoneFormData) => ({ ...p, frequency: e.target.value }))}
                      className="input"
                    >
                      <option value="">Geen vaste indeling</option>
                      <option value="weekly">Wekelijks</option>
                      <option value="biweekly">Om de week</option>
                      <option value="monthly">Maandelijks</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-[var(--color-danger)] text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200 font-medium">
                    {error}
                  </p>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Opslaan…' : editingZone ? 'Zone Bijwerken' : 'Zone Opslaan'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setDrawnGeojson(null); setEditingZone(null); setTagInput(''); }}
                    className="btn btn-ghost"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Point form */}
          {showPointForm && (
            <div className="p-5" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
                <h2 className="font-bold text-[var(--color-text)]">Nieuw Punt</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    value={pointFormData.title}
                    onChange={(e) => setPointFormData((p) => ({ ...p, title: e.target.value }))}
                    className="input"
                    placeholder="bijv. Afvalbak A1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['trash_bin', 'asset', 'other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPointFormData((p) => ({ ...p, type: t }))}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all active:scale-95 touch-manipulation ${
                          pointFormData.type === t
                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)]'
                        }`}
                      >
                        {POINT_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Notities
                  </label>
                  <textarea
                    value={pointFormData.notes}
                    onChange={(e) => setPointFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="input resize-none"
                    placeholder="Optionele notities…"
                    rows={3}
                  />
                </div>

                {pointError && (
                  <p className="text-[var(--color-danger)] text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-200 font-medium">
                    {pointError}
                  </p>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={handleSavePoint}
                    disabled={savingPoint}
                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingPoint ? 'Opslaan…' : 'Punt Opslaan'}
                  </button>
                  <button
                    onClick={() => { setShowPointForm(false); setPointGeojson(null); }}
                    className="btn btn-ghost"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zone list */}
          {mode === 'zone' && (
          <div className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-4">
              Alle Zones
            </h2>

            {loading ? (
              <p className="text-[var(--color-text-light)] text-sm text-center py-6">Laden…</p>
            ) : zones.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MapPin className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-light)]" />
                <p className="text-[var(--color-text)] font-semibold mb-2">
                  Nog geen zones
                </p>
                <p className="text-[var(--color-text-light)] text-sm">
                  Klik op het <strong>polygoon</strong> of <strong>rechthoek</strong> icoon linksboven op de kaart om uw eerste zone te tekenen.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {zones.map((zone: Zone) => {
                  const badge = zone.type === 'grass' ? 'badge-grass' : 'badge-maintenance';
                  const lastWorked = zone.last_worked_at 
                    ? new Date(zone.last_worked_at).toLocaleDateString() 
                    : null;
                  const nextWork = zone.next_scheduled_work 
                    ? new Date(zone.next_scheduled_work).toLocaleDateString() 
                    : null;
                  
                  return (
                    <li
                      key={zone.id}
                      className="flex items-center justify-between rounded-xl px-4 py-3.5 border-2 transition-colors"
                      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--color-text)] truncate">{zone.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                            {zone.type}
                          </span>
                          {zone.area_m2 != null && zone.area_m2 > 0 && (
                            <span className="text-xs text-[var(--color-text-muted)]">
                              📐 {zone.area_m2.toLocaleString()} m²
                            </span>
                          )}
                          {lastWorked && (
                            <span className="text-xs text-[var(--color-text-muted)]">
                              Laatst: {lastWorked}
                            </span>
                          )}
                          {nextWork && (
                            <span className="text-xs text-[var(--color-secondary)] font-medium">
                              Volgend: {nextWork}
                            </span>
                          )}
                        </div>
                        {zone.tags && zone.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {zone.tags.map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(10,147,150,0.1)', color: 'var(--color-secondary)' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleEditZone(zone)}
                          className="p-2.5 rounded-xl transition-colors touch-manipulation"
                          style={{ color: 'var(--color-secondary)' }}
                          title="Bewerk zone"
                          aria-label={`Bewerk ${zone.title}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          disabled={deletingId === zone.id}
                          className="p-2.5 rounded-xl transition-colors disabled:opacity-50 touch-manipulation"
                          style={{ color: 'var(--color-danger)' }}
                          title="Verwijder zone"
                          aria-label={`Verwijder ${zone.title}`}
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
          )}

          {/* Points list */}
          {mode === 'point' && (
          <div className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-4">
              Alle Punten
            </h2>

            {loading ? (
              <p className="text-[var(--color-text-light)] text-sm text-center py-6">Laden…</p>
            ) : points.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MapPin className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-light)]" />
                <p className="text-[var(--color-text)] font-semibold mb-2">
                  Nog geen punten
                </p>
                <p className="text-[var(--color-text-light)] text-sm">
                  Klik op het <strong>markering</strong> icoon linksboven op de kaart om uw eerste punt te plaatsen.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {points.map((point) => (
                  <li
                    key={point.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 border-2 transition-colors"
                    style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--color-text)] truncate">{point.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {POINT_TYPE_LABELS[point.type]}
                        </span>
                      </div>
                      {point.notes && (
                        <p className="text-xs text-[var(--color-text-light)] mt-1 truncate">{point.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => handleDeletePoint(point.id)}
                        disabled={deletingId === point.id}
                        className="p-2.5 rounded-xl transition-colors disabled:opacity-50 touch-manipulation"
                        style={{ color: 'var(--color-danger)' }}
                        title="Verwijder punt"
                        aria-label={`Verwijder ${point.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

