'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Edit3, MapPin, PenSquare } from 'lucide-react';
import { Zone, ZoneType } from '@/lib/types';

const AdminMap = dynamic(() => import('@/components/AdminMap'), { ssr: false });

interface ZoneFormData {
  name: string;
  type: ZoneType;
  instructions: string;
}

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string; badge: string }[] = [
  { value: 'grass',       label: 'Grass',       badge: 'badge-grass' },
  { value: 'waste',       label: 'Waste',        badge: 'badge-waste' },
  { value: 'maintenance', label: 'Maintenance',  badge: 'badge-maintenance' },
];

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawnGeojson, setDrawnGeojson] = useState<GeoJSON.Feature | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    type: 'grass',
    instructions: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  useEffect(() => {
    loadZones();
  }, []);

  const handlePolygonDrawn = (geojson: GeoJSON.Feature) => {
    setDrawnGeojson(geojson);
    setShowForm(true);
    setEditingZone(null);
    setFormData({ name: '', type: 'grass', instructions: '' });
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setDrawnGeojson(zone.geojson);
    setFormData({
      name: zone.name,
      type: zone.type,
      instructions: zone.instructions || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Zone name is required');
      return;
    }
    if (!drawnGeojson) {
      setError('Please draw a polygon on the map');
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
        throw new Error(data.error || 'Failed to save zone');
      }

      await loadZones();
      setShowForm(false);
      setDrawnGeojson(null);
      setEditingZone(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Delete this zone? This will also delete all associated tasks.')) return;
    setDeletingId(zoneId);

    try {
      const res = await fetch(`/api/zones/${zoneId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadZones();
    } catch {
      alert('Failed to delete zone');
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
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-lg font-bold text-white flex-1">Zone Editor</h1>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <MapPin className="w-3.5 h-3.5" />
          {zones.length} zone{zones.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div className="relative h-64 sm:h-80 lg:h-auto lg:flex-1">
          <AdminMap
            zones={zones}
            onPolygonDrawn={handlePolygonDrawn}
            editingGeojson={editingZone ? editingZone.geojson : null}
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
                  {editingZone ? 'Edit Zone' : 'New Zone'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="input"
                    placeholder="e.g. North Entrance Lawn"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2">
                    Zone Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ZONE_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, type: opt.value }))}
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
                    Instructions{' '}
                    <span className="normal-case font-normal text-[var(--color-text-light)]">(Markdown supported)</span>
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                    className="input resize-none"
                    placeholder="## Tasks&#10;- Task 1&#10;&#10;## Notes&#10;- Note 1"
                    rows={5}
                  />
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
                    {saving ? 'Saving…' : editingZone ? 'Update Zone' : 'Save Zone'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setDrawnGeojson(null); setEditingZone(null); }}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zone list */}
          <div className="p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-4">
              All Zones
            </h2>

            {loading ? (
              <p className="text-[var(--color-text-light)] text-sm text-center py-6">Loading…</p>
            ) : zones.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-light)]" />
                <p className="text-[var(--color-text-light)] text-sm italic">
                  No zones yet. Use the draw tool on the map.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {zones.map((zone) => {
                  const badge = zone.type === 'grass' ? 'badge-grass' : zone.type === 'waste' ? 'badge-waste' : 'badge-maintenance';
                  return (
                    <li
                      key={zone.id}
                      className="flex items-center justify-between rounded-xl px-4 py-3.5 border-2 transition-colors"
                      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--color-text)] truncate">{zone.name}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                          {zone.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleEditZone(zone)}
                          className="p-2.5 rounded-xl transition-colors touch-manipulation"
                          style={{ color: 'var(--color-secondary)' }}
                          title="Edit zone"
                          aria-label={`Edit ${zone.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone.id)}
                          disabled={deletingId === zone.id}
                          className="p-2.5 rounded-xl transition-colors disabled:opacity-50 touch-manipulation"
                          style={{ color: 'var(--color-danger)' }}
                          title="Delete zone"
                          aria-label={`Delete ${zone.name}`}
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
    </div>
  );
}

