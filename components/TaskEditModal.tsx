'use client';

import { useState } from 'react';
import { TaskWithZone, TaskType, WeatherCondition, DifficultyLevel } from '@/lib/types';
import { X, Scissors, Trash2, Wrench, Clock, Save, AlertTriangle } from 'lucide-react';

interface TaskEditModalProps {
  task: TaskWithZone;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
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

export default function TaskEditModal({ task, onClose, onSuccess, onDelete }: TaskEditModalProps) {
  const [taskType, setTaskType] = useState<TaskType>(task.task_type);
  const [duration, setDuration] = useState(String(task.duration_minutes));
  const [notes, setNotes] = useState(task.notes || '');
  const [weather, setWeather] = useState<WeatherCondition | null>(task.weather_condition);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(task.difficulty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const addMinutes = (mins: number) => {
    const current = parseInt(duration, 10) || 0;
    setDuration(String(current + mins));
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
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: taskType,
          duration_minutes: durationNum,
          notes: notes.trim() || null,
          weather_condition: weather,
          difficulty,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const zoneName = task.zones?.title || task.zones?.name || 'Onbekende zone';

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
            <h3 className="text-lg font-bold text-[var(--color-text)]">Taak Bewerken</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{zoneName}</p>
          </div>
          <button
            onClick={onClose}
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

          {/* Action Buttons */}
          <div className="pb-safe pt-1 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Opslaan…</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Wijzigingen Opslaan
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-base font-semibold transition-all border-2 border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-red-50 active:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
              Taak Verwijderen
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[2100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--color-surface)] rounded-2xl max-w-sm w-full p-6 animate-scale-in shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-[var(--color-danger)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">Taak Verwijderen?</h3>
            </div>
            <p className="text-[var(--color-text-muted)] mb-6">
              Weet je zeker dat je deze taak wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Verwijderen…' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
