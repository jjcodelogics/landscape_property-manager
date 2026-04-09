'use client';

import { useState, useEffect, useRef } from 'react';
import { Zone, TaskType, WeatherCondition, DifficultyLevel } from '@/lib/types';
import { X, Scissors, Trash2, Wrench, Clock, ClipboardList, Play, Pause, ToggleLeft, ToggleRight } from 'lucide-react';

interface TaskFormProps {
  zone: Zone;
  onClose: () => void;
  onSuccess: () => void;
}

const TASK_TYPES: { value: TaskType; label: string; icon: React.ReactNode }[] = [
  { value: 'mowing',      label: 'Maaien',      icon: <Scissors className="w-4 h-4" /> },
  { value: 'waste',       label: 'Afval',        icon: <Trash2   className="w-4 h-4" /> },
  { value: 'maintenance', label: 'Onderhoud',  icon: <Wrench   className="w-4 h-4" /> },
];

const WEATHER_OPTIONS: { value: WeatherCondition; label: string; emoji: string }[] = [
  { value: 'good',   label: 'Goed',   emoji: '☀️' },
  { value: 'normal', label: 'Normaal', emoji: '🌤️' },
  { value: 'bad',    label: 'Slecht',    emoji: '🌧️' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; emoji: string }[] = [
  { value: 'normal', label: 'Normaal', emoji: '🟢' },
  { value: 'dirty',  label: 'Vuil',  emoji: '🟡' },
  { value: 'heavy',  label: 'Zwaar',  emoji: '🔴' },
];

const QUICK_MINUTES = [5, 10, 15, 30, 45, 60];

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TaskForm({ zone, onClose, onSuccess }: TaskFormProps) {
  const [taskType, setTaskType] = useState<TaskType>('mowing');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chess clock state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'productive' | 'non_productive'>('productive');
  const [productiveSecs, setProductiveSecs] = useState(0);
  const [nonProductiveSecs, setNonProductiveSecs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        if (timerMode === 'productive') {
          setProductiveSecs((s) => s + 1);
        } else {
          setNonProductiveSecs((s) => s + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timerMode]);

  const handleStopTimer = () => {
    setTimerRunning(false);
    const totalMins = Math.ceil((productiveSecs + nonProductiveSecs) / 60);
    if (totalMins > 0) setDuration(String(totalMins));
  };

  const addMinutes = (mins: number) => {
    const current = parseInt(duration, 10) || 0;
    setDuration(String(current + mins));
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerMode('productive');
    setProductiveSecs(0);
    setNonProductiveSecs(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const durationNum = parseInt(duration, 10);
    if (!durationNum || durationNum <= 0) {
      setError('Please enter a valid duration in minutes.');
      return;
    }

    setLoading(true);
    try {
      const productive_minutes = Math.floor(productiveSecs / 60);
      const non_productive_minutes = Math.floor(nonProductiveSecs / 60);
      const mode = (productive_minutes > 0 || non_productive_minutes > 0)
        ? (productive_minutes >= non_productive_minutes ? 'productive' : 'non_productive')
        : null;

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zone.id,
          task_type: taskType,
          duration_minutes: durationNum,
          notes: notes.trim() || null,
          weather_condition: weather,
          difficulty,
          mode,
          productive_minutes,
          non_productive_minutes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log task');
      }

      // Reset timer state after successful submission
      resetTimer();
      setDuration('');
      setNotes('');
      setWeather(null);
      setDifficulty(null);
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="bg-[var(--color-surface)] rounded-t-[1.5rem] sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] flex flex-col animate-slide-in-bottom sm:animate-fade-in"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">Taak Registreren</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{zone.title}</p>
          </div>
          <button
            onClick={() => {
              resetTimer();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors touch-manipulation"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5 overflow-y-auto overscroll-contain flex-1">
          {/* Task type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5">
              Taaktype
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_TYPES.map((type) => {
                const active = taskType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTaskType(type.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation min-h-[64px] border-2 ${
                      active
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]'
                    }`}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5">
              Weer <span className="normal-case font-normal text-[var(--color-text-light)]">(optioneel)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WEATHER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWeather(weather === opt.value ? null : opt.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation border-2 ${
                    weather === opt.value
                      ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)] text-white'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5">
              Moeilijkheidsgraad <span className="normal-case font-normal text-[var(--color-text-light)]">(optioneel)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficulty(difficulty === opt.value ? null : opt.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation border-2 ${
                    difficulty === opt.value
                      ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)] text-white'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chess clock */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Timer (optioneel)
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div
                className={`rounded-lg p-3 transition-all ${timerMode === 'productive' && timerRunning ? 'ring-2 ring-[var(--color-secondary)]' : ''}`}
                style={{ background: 'rgba(10,147,150,0.08)' }}
              >
                <p className="text-xs font-semibold text-[var(--color-secondary)] mb-1">⚡ Productief</p>
                <p className="text-xl font-bold text-[var(--color-text)] font-mono">{formatSeconds(productiveSecs)}</p>
              </div>
              <div
                className={`rounded-lg p-3 transition-all ${timerMode === 'non_productive' && timerRunning ? 'ring-2 ring-[var(--color-warning)]' : ''}`}
                style={{ background: 'rgba(214,158,46,0.08)' }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--color-warning)' }}>⏸ Niet-productief</p>
                <p className="text-xl font-bold text-[var(--color-text)] font-mono">{formatSeconds(nonProductiveSecs)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!timerRunning ? (
                <button
                  type="button"
                  onClick={() => setTimerRunning(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: 'var(--color-secondary)' }}
                >
                  <Play className="w-4 h-4" /> Starten
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setTimerMode(timerMode === 'productive' ? 'non_productive' : 'productive')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: timerMode === 'productive' ? 'var(--color-secondary)' : 'var(--color-warning)' }}
                  >
                    {timerMode === 'productive' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {timerMode === 'productive' ? 'Productief' : 'Niet-productief'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStopTimer}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ border: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    <Pause className="w-4 h-4" /> Stop & Gebruiken
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5"
            >
              Duur (minuten)
            </label>
            {/* Quick add buttons */}
            <div className="flex gap-1.5 mb-2.5">
              {QUICK_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => addMinutes(m)}
                  className="quick-time-btn"
                  aria-label={`Voeg ${m} minuten toe`}
                >
                  +{m}
                </button>
              ))}
            </div>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-light)] pointer-events-none" />
              <input
                id="duration"
                type="number"
                inputMode="numeric"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Voer minuten in"
                className="input pl-10"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5"
            >
              Notities <span className="normal-case font-normal text-[var(--color-text-light)]">(optioneel)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuele opmerkingen of notities..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {error && (
            <p className="text-[var(--color-danger)] text-sm bg-red-50 px-4 py-3 rounded-xl font-medium border border-red-200">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="pb-safe pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Opslaan…</span>
              ) : (
                <>
                  <ClipboardList className="w-5 h-5" />
                  Taak Opslaan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

