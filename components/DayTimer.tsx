'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, Play, Square, RefreshCw } from 'lucide-react';
import { DaySession, DaySessionMode, NonProductiveReason } from '@/lib/types';

interface DaySessionSummary {
  total_productive_minutes: number;
  total_non_productive_minutes: number;
  active_session: DaySession | null;
}

const NON_PRODUCTIVE_REASONS: { value: NonProductiveReason; label: string; emoji: string }[] = [
  { value: 'driving', label: 'Rijden', emoji: '🚗' },
  { value: 'break', label: 'Pauze', emoji: '☕' },
  { value: 'loading', label: 'Laden', emoji: '📦' },
  { value: 'talking', label: 'Overleg', emoji: '💬' },
  { value: 'other', label: 'Anders', emoji: '⚙️' },
];

export default function DayTimer() {
  const [summary, setSummary] = useState<DaySessionSummary | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [showReasons, setShowReasons] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/day-sessions');
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error loading day sessions:', error);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getCurrentSessionDuration = () => {
    if (!summary?.active_session) return 0;
    const start = new Date(summary.active_session.start_time).getTime();
    return Math.floor((currentTime - start) / 60000);
  };

  const startSession = async (mode: DaySessionMode, reason?: NonProductiveReason) => {
    setLoading(true);
    setShowReasons(false);
    try {
      const res = await fetch('/api/day-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, non_productive_reason: reason }),
      });
      if (!res.ok) throw new Error('Failed to start session');
      await loadSessions();
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Fout bij starten sessie');
    } finally {
      setLoading(false);
    }
  };

  const stopDay = async () => {
    if (!summary?.active_session) return;
    if (!confirm('Dag beëindigen?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/day-sessions/${summary.active_session.id}`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to stop session');
      await loadSessions();
    } catch (error) {
      console.error('Error stopping session:', error);
      alert('Fout bij stoppen sessie');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (!summary?.active_session) return;
    const newMode: DaySessionMode = summary.active_session.mode === 'productive' ? 'non_productive' : 'productive';
    
    if (newMode === 'non_productive') {
      setShowReasons(true);
    } else {
      startSession(newMode);
    }
  };

  const isActive = !!summary?.active_session;
  const mode = summary?.active_session?.mode || 'productive';
  const currentSessionMinutes = getCurrentSessionDuration();
  const totalProductive = (summary?.total_productive_minutes || 0) + (isActive && mode === 'productive' ? currentSessionMinutes : 0);
  const totalNonProductive = (summary?.total_non_productive_minutes || 0) + (isActive && mode === 'non_productive' ? currentSessionMinutes : 0);

  return (
    <>
      {/* Compact Timer Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all ${isExpanded ? 'h-auto' : 'h-16'}`}
        style={{
          background: isActive
            ? mode === 'productive'
              ? 'linear-gradient(135deg, #0a9396 0%, #005f73 100%)'
              : 'linear-gradient(135deg, #e76f51 0%, #d62828 100%)'
            : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {!isExpanded ? (
          /* Collapsed View */
          <div
            className="h-full px-4 flex items-center justify-between cursor-pointer touch-manipulation"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-white" />
              {isActive ? (
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm leading-tight">
                    {mode === 'productive' ? '✓ Productief' : '⏸ Niet-Productief'}
                  </span>
                  <span className="text-white/80 text-xs leading-tight">
                    {formatTime(currentSessionMinutes)} / {formatTime(totalProductive + totalNonProductive)}
                  </span>
                </div>
              ) : (
                <span className="text-white font-semibold text-sm">Dag Timer</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMode();
                  }}
                  disabled={loading}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors touch-manipulation disabled:opacity-50"
                  aria-label="Wissel modus"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
              )}
              <span className="text-white/60 text-xs">▲</span>
            </div>
          </div>
        ) : (
          /* Expanded View */
          <div className="p-4 pb-6 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-base">Dag Timer</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/80 text-sm touch-manipulation"
              >
                ▼ Inklappen
              </button>
            </div>

            {/* Current Session */}
            {isActive && (
              <div className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-xs uppercase tracking-wider font-semibold">
                    Huidige Sessie
                  </span>
                  <span className="text-white font-bold text-2xl">
                    {formatTime(currentSessionMinutes)}
                  </span>
                </div>
                <div className="text-white text-sm font-semibold">
                  {mode === 'productive' ? '✓ Productief' : '⏸ Niet-Productief'}
                  {summary?.active_session?.non_productive_reason && (
                    <span className="ml-2 text-white/70 text-xs">
                      ({NON_PRODUCTIVE_REASONS.find(r => r.value === summary.active_session?.non_productive_reason)?.label})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-white/80 text-xs uppercase tracking-wider font-semibold mb-1">
                  Productief
                </div>
                <div className="text-white font-bold text-xl">
                  {formatTime(totalProductive)}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="text-white/80 text-xs uppercase tracking-wider font-semibold mb-1">
                  Niet-Productief
                </div>
                <div className="text-white font-bold text-xl">
                  {formatTime(totalNonProductive)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!isActive ? (
                <button
                  onClick={() => startSession('productive')}
                  disabled={loading}
                  className="btn flex-1 py-3 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 font-semibold touch-manipulation"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Dag
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMode}
                    disabled={loading}
                    className="btn flex-1 py-3 bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 font-semibold touch-manipulation"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Wissel Modus
                  </button>
                  <button
                    onClick={stopDay}
                    disabled={loading}
                    className="btn py-3 px-4 bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 font-semibold touch-manipulation"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reason Selector Modal */}
      {showReasons && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowReasons(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg text-gray-900">Reden voor Niet-Productief</h3>
            <div className="grid grid-cols-2 gap-2">
              {NON_PRODUCTIVE_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => startSession('non_productive', reason.value)}
                  disabled={loading}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-[var(--color-primary)] hover:bg-blue-50 transition-all touch-manipulation disabled:opacity-50 text-center"
                >
                  <div className="text-2xl mb-1">{reason.emoji}</div>
                  <div className="text-sm font-semibold text-gray-900">{reason.label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReasons(false)}
              className="btn btn-ghost w-full"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind timer */}
      <div className="h-16" />
    </>
  );
}
