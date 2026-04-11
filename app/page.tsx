'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TaskForm from '@/components/TaskForm';
import ZoneInstructionsGenerator from '@/components/ZoneInstructionsGenerator';
import { Zone } from '@/lib/types';
import { BarChart2, Settings, Leaf, CalendarDays, Route, TrendingUp, FileText, ChevronDown, CalendarRange } from 'lucide-react';
import Link from 'next/link';
import { getZoneColorLegend } from '@/lib/zone-colors';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAnalyticsDropdown, setShowAnalyticsDropdown] = useState(false);

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
      if (process.env.NODE_ENV === 'development') console.error('Failed to load zones:', error);
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
        className="absolute top-0 left-0 right-0 z-[1001] flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3 safe-top gap-2"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,95,115,0.97) 0%, rgba(0,95,115,0.82) 100%)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(148,210,189,0.25)' }}
          >
            <Leaf className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <span className="text-white font-bold text-sm sm:text-base tracking-tight hidden xs:inline truncate">
            LandscapeManager
          </span>
          <span className="text-white font-bold text-sm sm:text-base tracking-tight xs:hidden truncate">
            LM
          </span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <Link
            href="/week"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px] min-w-[40px] justify-center"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="Week overzicht"
          >
            <CalendarRange className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Week</span>
          </Link>
          <Link
            href="/plan"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px] min-w-[40px] justify-center"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="Dagplanning"
          >
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Planning</span>
          </Link>
          <Link
            href="/routes"
            className="hidden xs:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px] min-w-[40px] justify-center"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="Punten en routes"
          >
            <Route className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Routes</span>
          </Link>
          
          {/* Analytics Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAnalyticsDropdown(!showAnalyticsDropdown)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px] min-w-[40px] justify-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              aria-label="Analytics menu"
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">Analytics</span>
              <ChevronDown className="w-3.5 h-3.5 hidden md:inline flex-shrink-0" />
            </button>
            
            {showAnalyticsDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-[1000]" 
                  onClick={() => setShowAnalyticsDropdown(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl z-[1001] py-1"
                  style={{
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0,95,115,0.1)',
                  }}
                >
                  <button
                    onClick={() => {
                      setShowInstructions(true);
                      setShowAnalyticsDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Instructies</span>
                  </button>
                  <Link
                    href="/kpi"
                    onClick={() => setShowAnalyticsDropdown(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>KPI</span>
                  </Link>
                  <Link
                    href="/stats"
                    onClick={() => setShowAnalyticsDropdown(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span>Statistieken</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          <Link
            href="/admin/zones"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl text-sm font-semibold text-white transition-all touch-manipulation min-h-[40px] min-w-[40px] justify-center"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            aria-label="Beheerpaneel"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Beheer</span>
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
              <p className="text-sm opacity-70">Zones laden...</p>
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

      {/* ── Zone Instructions Generator ── */}
      {showInstructions && (
        <ZoneInstructionsGenerator
          zones={zones}
          onClose={() => setShowInstructions(false)}
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
          Last Worked
        </p>
        <div className="space-y-1.5">
          {getZoneColorLegend().map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {item.label}
                <span className="text-xs text-[var(--color-text-muted)] ml-1.5">
                  {item.description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

