'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, ChevronRight, Timer, Swords } from 'lucide-react';
import { PlannedTaskWithZone, TaskWithZone } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDayLabel(): string {
  const now = new Date();
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type TimerMode = 'productive' | 'non_productive';

interface TodayTask {
  plannedTask: PlannedTaskWithZone;
  completedTask: TaskWithZone | null;
}

// ─── Quick-log bottom sheet ───────────────────────────────────────────────────

interface LogSheetProps {
  task: TodayTask;
  onLog: (plannedTaskId: string, zoneId: string, minutes: number) => Promise<void>;
  onClose: () => void;
}

const QUICK_MINS = [15, 30, 45, 60, 90, 120];

function LogSheet({ task, onLog, onClose }: LogSheetProps) {
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSecs((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const handleLog = async (mins: number) => {
    if (loading || mins <= 0) return;
    setLoading(true);
    await onLog(task.plannedTask.id, task.plannedTask.zone_id, mins);
    setLoading(false);
  };

  const handleTimerDone = () => {
    setTimerRunning(false);
    const mins = Math.max(1, Math.round(timerSecs / 60));
    handleLog(mins);
  };

  const zoneTitle = task.plannedTask.zones?.title ?? 'Zone';
  const estimated = task.plannedTask.estimated_minutes;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl pb-safe"
        style={{ background: 'var(--color-surface)', boxShadow: '0 -8px 32px rgba(0,0,0,0.18)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--color-border)' }} />
        </div>

        <div className="px-5 pb-6 pt-2 space-y-5">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">{zoneTitle}</h2>
            {estimated > 0 && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                Gepland: {formatMins(estimated)}
              </p>
            )}
          </div>

          {/* Timer section */}
          {!timerRunning ? (
            <button
              onClick={() => { setTimerSecs(0); setTimerRunning(true); }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border-2 transition-colors touch-manipulation"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              <Timer className="w-4 h-4" />
              Start timer
            </button>
          ) : (
            <button
              onClick={handleTimerDone}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-colors touch-manipulation"
              style={{ background: 'var(--color-danger)' }}
            >
              <Timer className="w-4 h-4" />
              Stop — {formatTimer(timerSecs)}
            </button>
          )}

          {/* Quick log buttons */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
              Snel registreren
            </p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_MINS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleLog(m)}
                  disabled={loading}
                  className="py-3.5 rounded-xl text-sm font-bold text-white transition-opacity touch-manipulation disabled:opacity-50"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {formatMins(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="480"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Aantal minuten..."
              className="flex-1 px-3 py-3 rounded-xl border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
            />
            <button
              onClick={() => handleLog(parseInt(custom, 10) || 0)}
              disabled={loading || !custom}
              className="px-5 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity touch-manipulation"
              style={{ background: 'var(--color-secondary)' }}
            >
              Klaar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Task row ────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TodayTask;
  isNext: boolean;
  onTap: () => void;
  onSwipeComplete: () => void;
}

function TaskRow({ task, isNext, onTap, onSwipeComplete }: TaskRowProps) {
  const done = !!task.completedTask;
  const title = task.plannedTask.zones?.title ?? 'Zone';
  const planned = task.plannedTask.estimated_minutes;
  const actual = task.completedTask?.duration_minutes;

  // Touch swipe detection
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (dx > 80 && !done) onSwipeComplete();
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={done ? undefined : onTap}
      className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all ${
        done
          ? 'opacity-50 cursor-default'
          : isNext
          ? 'cursor-pointer active:scale-[0.99]'
          : 'cursor-pointer active:scale-[0.99]'
      }`}
      style={{
        background: done
          ? 'rgba(56,161,105,0.07)'
          : isNext
          ? 'var(--color-surface)'
          : 'var(--color-surface)',
        borderColor: done
          ? 'rgba(56,161,105,0.3)'
          : isNext
          ? 'var(--color-primary)'
          : 'var(--color-border)',
        boxShadow: isNext && !done ? '0 0 0 3px rgba(0,95,115,0.12)' : undefined,
      }}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {done ? (
          <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
        ) : (
          <Circle className="w-6 h-6 text-[var(--color-border)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isNext && !done && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,95,115,0.12)', color: 'var(--color-primary)' }}
            >
              NEXT
            </span>
          )}
          <span
            className={`font-semibold truncate ${done ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {planned > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]">
              Gepland: {formatMins(planned)}
            </span>
          )}
          {actual != null && (
            <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
              ✓ {formatMins(actual)}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      {!done && (
        <ChevronRight className="w-5 h-5 flex-shrink-0 text-[var(--color-text-muted)]" />
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function TodayPage() {
  const today = getTodayStr();

  const [plannedTasks, setPlannedTasks] = useState<PlannedTaskWithZone[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskWithZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [timerMode, setTimerMode] = useState<TimerMode>('productive');
  const [globalSecs, setGlobalSecs] = useState(0);
  const [activeSheet, setActiveSheet] = useState<string | null>(null); // plannedTask.id
  const [logging, setLogging] = useState(false);

  // ── Global timer ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setGlobalSecs((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [ptRes, tasksRes] = await Promise.all([
          fetch(`/api/planned-tasks?start_date=${today}&end_date=${today}`),
          fetch(`/api/tasks/weekly?start_date=${today}&end_date=${today}`),
        ]);
        if (ptRes.ok) setPlannedTasks(await ptRes.json());
        if (tasksRes.ok) setCompletedTasks(await tasksRes.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [today]);

  // ── Merge planned + completed ─────────────────────────────────────
  const todayTasks: TodayTask[] = plannedTasks.map((pt) => ({
    plannedTask: pt,
    completedTask:
      completedTasks.find((t) => t.zone_id === pt.zone_id) ?? null,
  }));

  const incomplete = todayTasks.filter((t) => !t.completedTask);
  const complete = todayTasks.filter((t) => t.completedTask);
  const orderedTasks = [...incomplete, ...complete];

  const nextTask = incomplete[0] ?? null;
  const completedCount = complete.length;
  const totalCount = todayTasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ── Log a task ────────────────────────────────────────────────────
  const handleLog = async (
    plannedTaskId: string,
    zoneId: string,
    minutes: number
  ) => {
    if (logging) return;
    setLogging(true);

    // Optimistic update
    const fakeDoneTask: TaskWithZone = {
      id: `optimistic-${Date.now()}`,
      zone_id: zoneId,
      task_type: 'mowing',
      duration_minutes: minutes,
      notes: null,
      weather_condition: null,
      difficulty: null,
      mode: timerMode === 'productive' ? 'productive' : 'non_productive',
      productive_minutes: timerMode === 'productive' ? minutes : 0,
      non_productive_minutes: timerMode !== 'productive' ? minutes : 0,
      created_at: new Date().toISOString(),
    };
    setCompletedTasks((prev) => [...prev, fakeDoneTask]);
    setActiveSheet(null);

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zoneId,
          task_type: 'mowing',
          duration_minutes: minutes,
          mode: timerMode === 'productive' ? 'productive' : 'non_productive',
          productive_minutes: timerMode === 'productive' ? minutes : 0,
          non_productive_minutes: timerMode !== 'productive' ? minutes : 0,
        }),
      });
      // Refresh for real data
      const tasksRes = await fetch(`/api/tasks/weekly?start_date=${today}&end_date=${today}`);
      if (tasksRes.ok) setCompletedTasks(await tasksRes.json());
    } catch {
      // Revert on fail
      setCompletedTasks((prev) => prev.filter((t) => t.id !== fakeDoneTask.id));
    } finally {
      setLogging(false);
    }
  };

  // ── Swipe complete (use estimated time) ───────────────────────────
  const handleSwipeComplete = (task: TodayTask) => {
    handleLog(task.plannedTask.id, task.plannedTask.zone_id, task.plannedTask.estimated_minutes || 30);
  };

  const activeTask = activeSheet
    ? todayTasks.find((t) => t.plannedTask.id === activeSheet) ?? null
    : null;

  // ── Productive vs Non-productive totals ───────────────────────────
  const prodMins = completedTasks.reduce((s, t) => s + (t.productive_minutes || 0), 0);
  const nonProdMins = completedTasks.reduce((s, t) => s + (t.non_productive_minutes || 0), 0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)', fontFamily: 'var(--font-sans)' }}
    >
      {/* ── Sticky Global Timer Bar ───────────────────────────── */}
      <div
        className="sticky top-0 z-30 safe-top"
        style={{ background: 'var(--color-primary)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-stretch">
          {/* Productive side */}
          <button
            onClick={() => setTimerMode('productive')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all touch-manipulation ${
              timerMode === 'productive' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              borderBottom: timerMode === 'productive' ? '3px solid #94d2bd' : '3px solid transparent',
            }}
          >
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-base">🟢</span>
              <span className="text-xs font-bold uppercase tracking-wide">Productief</span>
            </div>
            <span className="text-white font-bold text-lg leading-tight mt-0.5">
              {formatMins(prodMins + Math.floor(globalSecs / 60))}
            </span>
          </button>

          {/* Divider */}
          <div className="w-px my-3" style={{ background: 'rgba(255,255,255,0.2)' }} />

          {/* Non-productive side */}
          <button
            onClick={() => setTimerMode('non_productive')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all touch-manipulation ${
              timerMode === 'non_productive' ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              borderBottom: timerMode === 'non_productive' ? '3px solid #e17055' : '3px solid transparent',
            }}
          >
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-base">🔴</span>
              <span className="text-xs font-bold uppercase tracking-wide">Niet-prod</span>
            </div>
            <span className="text-white font-bold text-lg leading-tight mt-0.5">
              {formatMins(nonProdMins)}
            </span>
          </button>
        </div>
      </div>

      {/* ── Page body ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-4 pb-8 gap-4">

        {/* Back button */}
        <div className="flex items-center gap-2">
          <Link
            href="/week"
            className="flex items-center gap-1 text-sm text-[var(--color-text-muted)] touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </Link>
        </div>

        {/* ── Today Header ───────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-xl font-bold text-[var(--color-text)]">Attackplan</h1>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Vandaag — {getDayLabel()}
          </p>
          {totalCount > 0 && (
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--color-primary)' }}>
              {completedCount} / {totalCount} taken afgerond
            </p>
          )}
        </div>

        {/* ── Progress bar ───────────────────────────────────── */}
        {totalCount > 0 && (
          <div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct === 100
                    ? 'var(--color-success)'
                    : 'var(--color-primary)',
                }}
              />
            </div>
            <p className="text-xs text-right mt-1 text-[var(--color-text-muted)]">
              {progressPct}%
            </p>
          </div>
        )}

        {/* ── Task list ──────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'var(--color-border)' }}
              />
            ))}
          </div>
        ) : orderedTasks.length === 0 ? (
          /* ── Empty state ─────────────────────────────────── */
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed gap-4"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-5xl">📋</span>
            <div className="text-center">
              <p className="font-semibold text-[var(--color-text)]">Geen plan voor vandaag</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Voeg taken toe via de weekplanning
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/week"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white touch-manipulation"
                style={{ background: 'var(--color-primary)' }}
              >
                Naar Week
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {orderedTasks.map((task) => (
              <TaskRow
                key={task.plannedTask.id}
                task={task}
                isNext={nextTask?.plannedTask.id === task.plannedTask.id}
                onTap={() => setActiveSheet(task.plannedTask.id)}
                onSwipeComplete={() => handleSwipeComplete(task)}
              />
            ))}
          </div>
        )}

        {/* ── All done state ─────────────────────────────────── */}
        {totalCount > 0 && completedCount === totalCount && (
          <div
            className="text-center py-6 rounded-2xl"
            style={{ background: 'rgba(56,161,105,0.08)', border: '2px solid rgba(56,161,105,0.25)' }}
          >
            <p className="text-2xl mb-1">🎉</p>
            <p className="font-bold text-[var(--color-success)]">Alle taken afgerond!</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Goed gedaan vandaag.
            </p>
          </div>
        )}
      </div>

      {/* ── Log bottom sheet ───────────────────────────────────── */}
      {activeTask && (
        <LogSheet
          task={activeTask}
          onLog={handleLog}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </div>
  );
}
