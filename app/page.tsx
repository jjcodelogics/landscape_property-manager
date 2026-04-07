'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskForm from '@/components/TaskForm';
import { Zone } from '@/lib/types';
import { BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/zones')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setZones(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleZoneClick = useCallback((zone: Zone) => {
    setSelectedZone(zone);
    setShowTaskForm(false);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedZone(null);
  }, []);

  const handleLogTask = useCallback(() => {
    setShowTaskForm(true);
  }, []);

  const handleTaskSuccess = useCallback(() => {
    setShowTaskForm(false);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-900">
      <div className="absolute top-0 left-0 right-0 z-[1001] flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur-sm">
        <h1 className="text-white font-bold text-lg">🌿 LandscapeManager</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/stats"
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </Link>
          <Link
            href="/admin/zones"
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>

      <div className="w-full h-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-500 text-lg">Loading map...</div>
          </div>
        ) : (
          <Map
            zones={zones}
            selectedZoneId={selectedZone?.id || null}
            onZoneClick={handleZoneClick}
          />
        )}
      </div>

      {selectedZone && (
        <Sidebar
          zone={selectedZone}
          onClose={handleCloseSidebar}
          onLogTask={handleLogTask}
        />
      )}

      {showTaskForm && selectedZone && (
        <TaskForm
          zone={selectedZone}
          onClose={() => setShowTaskForm(false)}
          onSuccess={handleTaskSuccess}
        />
      )}

      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Zones</p>
        <div className="space-y-1">
          {[
            { type: 'grass', color: 'bg-green-500', label: 'Grass' },
            { type: 'waste', color: 'bg-orange-500', label: 'Waste' },
            { type: 'maintenance', color: 'bg-blue-500', label: 'Maintenance' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-sm ${item.color}`} />
              <span className="text-xs text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
