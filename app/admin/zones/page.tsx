'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Edit3 } from 'lucide-react';
import { Zone, ZoneType } from '@/lib/types';

const AdminMap = dynamic(() => import('@/components/AdminMap'), { ssr: false });

interface ZoneFormData {
  name: string;
  type: ZoneType;
  instructions: string;
}

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
      const data = await res.json();
      setZones(Array.isArray(data) ? data : []);
    } catch {
      // ignore
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
        body: JSON.stringify({
          ...formData,
          geojson: drawnGeojson,
        }),
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1">Zone Editor</h1>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="relative h-64 lg:h-auto lg:flex-1">
          <AdminMap
            zones={zones}
            onPolygonDrawn={handlePolygonDrawn}
            editingGeojson={editingZone ? editingZone.geojson : null}
          />
        </div>

        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l overflow-y-auto">
          {showForm && (
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 mb-3">
                {editingZone ? 'Edit Zone' : 'New Zone'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Zone name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as ZoneType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="grass">Grass</option>
                    <option value="waste">Waste</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions (Markdown supported)
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Enter instructions using Markdown..."
                    rows={4}
                  />
                </div>
                {error && (
                  <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                  >
                    {saving ? 'Saving...' : editingZone ? 'Update Zone' : 'Save Zone'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setDrawnGeojson(null); setEditingZone(null); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">
                Zones ({zones.length})
              </h2>
              <p className="text-xs text-gray-500">Draw on map to add</p>
            </div>

            {loading ? (
              <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
            ) : zones.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8 italic">
                No zones yet. Use the draw tool on the map.
              </p>
            ) : (
              <ul className="space-y-2">
                {zones.map((zone) => (
                  <li
                    key={zone.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{zone.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{zone.type}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleEditZone(zone)}
                        className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Edit zone"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        disabled={deletingId === zone.id}
                        className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors disabled:opacity-50"
                        title="Delete zone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
