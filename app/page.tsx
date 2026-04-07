'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskForm from '@/components/TaskForm';
import { Zone } from '@/lib/types';
import { HARDCODED_ZONES } from '@/lib/zones';
import { BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using hardcoded zones for testing map interaction
    // TODO: Replace with API call when database is ready
    setZones(HARDCODED_ZONES);
    setLoading(false);
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
      {/* Mobile-optimized header */}
      <div className="absolute top-0 left-0 right-0 z-[1001] flex items-center justify-between px-3 sm:px-4 py-3 bg-gray-900/90 backdrop-blur-md shadow-lg safe-top\">
        <h1 className="text-white font-bold text-base sm:text-lg flex items-center gap-2\">
          <span className="text-xl sm:text-2xl">🌿</span>
          <span className="hidden xs:inline\">LandscapeManager</span>
          <span className="xs:hidden\">Landscape</span>
        </h1>
        <div className="flex items-center gap-1.5 sm:gap-2\">
          <Link
            href="/stats"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-xl text-sm transition-all touch-manipulation min-h-[44px]"
            aria-label="View statistics"
          >
            <BarChart2 className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline font-medium">Stats</span>
          </Link>
          <Link
            href="/admin/zones"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/25 text-white rounded-xl text-sm transition-all touch-manipulation min-h-[44px]"
            aria-label="Admin panel"
          >
            <Settings className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline font-medium">Admin</span>
          </Link>
        </div>
      </div>

      <div className="w-full h-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center\">
              <div className=\"text-4xl mb-3\">🌿</div>
              <div className="text-gray-600 text-base font-medium">Loading map...</div>
            </div>
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

      {/* Mobile-optimized legend */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 shadow-xl max-w-[calc(100vw-24px)] sm:max-w-none safe-bottom\">
        <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Zone Types</p>
        <div className="space-y-1.5\">
          {[
            { type: 'grass', color: 'bg-green-500', label: 'Grass' },
            { type: 'waste', color: 'bg-orange-500', label: 'Waste' },
            { type: 'maintenance', color: 'bg-blue-500', label: 'Maintenance' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-2.5\">
              <div className={`w-4 h-4 rounded ${item.color} shadow-sm`} />
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
