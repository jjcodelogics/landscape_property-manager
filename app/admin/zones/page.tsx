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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setZones(Array.isArray(data) ? data : []);
    } catch {
      // ignore – zones will remain empty
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-safe\">
      {/* Mobile-optimized header */}
      <div className="bg-white border-b px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sticky top-0 z-20 shadow-sm safe-top\">
        <Link 
          href="/" 
          className="p-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
        </Link>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex-1">Zone Editor</h1>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden\">
        {/* Map container */}
        <div className="relative h-64 sm:h-80 lg:h-auto lg:flex-1\">
          <AdminMap
            zones={zones}
            onPolygonDrawn={handlePolygonDrawn}
            editingGeojson={editingZone ? editingZone.geojson : null}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l overflow-y-auto flex-1 lg:flex-none\">{showForm && (
            <div className="p-4 sm:p-5 border-b bg-gray-50\">
              <h2 className="font-bold text-gray-900 mb-4 text-base sm:text-lg\">
                {editingZone ? 'Edit Zone' : 'New Zone'}
              </h2>
              <div className="space-y-4\">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2\">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all touch-manipulation"
                    placeholder="Zone name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2\">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as ZoneType }))}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all touch-manipulation appearance-none bg-white"
                  >
                    <option value="grass">Grass</option>
                    <option value="waste">Waste</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2\">
                    Instructions (Markdown supported)
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 resize-none transition-all touch-manipulation"
                    placeholder="Enter instructions using Markdown..."
                    rows={4}
                  />
                </div>
                {error && (
                  <p className="text-red-600 text-sm bg-red-50 p-4 rounded-xl font-medium\">{error}</p>
                )}
                <div className="flex gap-2.5\">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-base transition-all active:scale-[0.98] touch-manipulation min-h-[48px]"
                  >
                    {saving ? 'Saving...' : editingZone ? 'Update Zone' : 'Save Zone'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setDrawnGeojson(null); setEditingZone(null); }}
                    className="px-5 py-3.5 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all active:scale-[0.98] touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5\">
            <div className="flex items-center justify-between mb-4\">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg\">
                Zones ({zones.length})
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium\">Draw on map</p>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm text-center py-6 font-medium\">Loading...</p>
            ) : zones.length === 0 ? (
              <div className="text-center py-10\">
                <div className="text-3xl mb-2\">✏️</div>
                <p className="text-gray-400 text-sm italic\">
                  No zones yet. Use the draw tool on the map.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5\">
                {zones.map((zone) => (
                  <li
                    key={zone.id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3.5 border-2 border-gray-200 active:bg-gray-100 transition-colors\"
                  >
                    <div className="min-w-0 flex-1\">
                      <p className="font-semibold text-gray-900 text-base truncate\">{zone.name}</p>
                      <p className="text-sm text-gray-600 capitalize mt-0.5\">{zone.type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-3\">
                      <button
                        onClick={() => handleEditZone(zone)}
                        className="p-2.5 rounded-xl hover:bg-blue-100 active:bg-blue-200 text-blue-600 transition-colors touch-manipulation"
                        title="Edit zone"
                        aria-label={`Edit ${zone.name}`}
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(zone.id)}
                        disabled={deletingId === zone.id}
                        className="p-2.5 rounded-xl hover:bg-red-100 active:bg-red-200 text-red-600 transition-colors disabled:opacity-50 touch-manipulation"
                        title="Delete zone"
                        aria-label={`Delete ${zone.name}`}
                      >
                        <Trash2 className="w-5 h-5" />
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
