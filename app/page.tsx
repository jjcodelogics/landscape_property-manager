'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskForm from '@/components/TaskForm';
import { Zone } from '@/lib/types';
import { BarChart2, Settings, Leaf } from 'lucide-react';
import Link from 'next/link';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

const ZONE_TYPE_SWATCHES = [
  { type: 'grass',       color: '#6aa84f', label: 'Grass' },
  { type: 'waste',       color: '#3d85c6', label: 'Waste' },
  { type: 'maintenance', color: '#e69138', label: 'Maintenance' },
];

export default function Home() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const loadZones = useCallback(async () => {
    try {
      const res = await fetch('/api/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(Array.isArray(data) ? data : []);
        
        // Update selected zone if it's currently open
        if (selectedZone) {
          const updatedZone = data.find((z: Zone) => z.id === selectedZone.id);
          if (updatedZone) {
            setSelectedZone(updatedZone);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load zones:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    loadZones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <main className="relative w-screen h-screen overflow-hidden" style={{ background: '#1a2332' }}>
      {/* ── Header ── */}
      <header
        className="absolute top-0 left-0 right-0 z-[1001] flex items-center justify-between px-4 py-3 safe-top"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,95,115,0.97) 0%, rgba(0,95,115,0.82) 100%)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(148,210,189,0.25)' }}
          >
            <Leaf className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <span className="text-white font-bold text-base tracking-tight hidden xs:inline">
            LandscapeManager
          </span>
          <span className="text-white font-bold text-base tracking-tight xs:hidden">
            Landscape
          </span>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/stats"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px]"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="View statistics"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </Link>
          <Link
            href="/admin/zones"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px]"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="Admin panel"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </header>

      {/* ── Map ── */}
      <div className="w-full h-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-pulse mb-2">
                <Leaf className="w-8 h-8 mx-auto opacity-70" />
              </div>
              <p className="text-sm opacity-70">Loading zones...</p>
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

      {/* ── Sidebar ── */}
      {selectedZone && (
        <Sidebar
          zone={selectedZone}
          onClose={handleCloseSidebar}
          onLogTask={handleLogTask}
          onZoneUpdated={loadZones}
        />
      )}

      {/* ── Task form modal ── */}
      {showTaskForm && selectedZone && (
        <TaskForm
          zone={selectedZone}
          onClose={() => setShowTaskForm(false)}
          onSuccess={handleTaskSuccess}
        />
      )}

      {/* ── Legend ── */}
      <div
        className="absolute bottom-4 left-4 z-[1000] rounded-xl p-3 shadow-xl safe-bottom"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border)',
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>
          Zone Types
        </p>
        <div className="space-y-1.5">
          {ZONE_TYPE_SWATCHES.map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

