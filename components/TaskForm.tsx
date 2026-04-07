'use client';

import { useState } from 'react';
import { Zone, TaskType } from '@/lib/types';
import { X, Scissors, Trash2, Wrench, Clock, ClipboardList } from 'lucide-react';

interface TaskFormProps {
  zone: Zone;
  onClose: () => void;
  onSuccess: () => void;
}

const TASK_TYPES: { value: TaskType; label: string; icon: React.ReactNode }[] = [
  { value: 'mowing',      label: 'Mowing',      icon: <Scissors className="w-4 h-4" /> },
  { value: 'waste',       label: 'Waste',        icon: <Trash2   className="w-4 h-4" /> },
  { value: 'maintenance', label: 'Maintenance',  icon: <Wrench   className="w-4 h-4" /> },
];

const QUICK_MINUTES = [5, 10, 15, 30, 45, 60];

export default function TaskForm({ zone, onClose, onSuccess }: TaskFormProps) {
  const [taskType, setTaskType] = useState<TaskType>('mowing');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTaskTypeChange = (type: TaskType) => {
    setTaskType(type);
  };

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
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_id: zone.id,
          task_type: taskType,
          duration_minutes: durationNum,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log task');
      }

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
            <h3 className="text-lg font-bold text-[var(--color-text)]">Log Task</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{zone.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5 overflow-y-auto overscroll-contain flex-1">
          {/* Task type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5">
              Task Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_TYPES.map((type) => {
                const active = taskType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTaskTypeChange(type.value)}
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

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2.5"
            >
              Duration (minutes)
            </label>
            {/* Quick add buttons */}
            <div className="flex gap-1.5 mb-2.5">
              {QUICK_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => addMinutes(m)}
                  className="quick-time-btn"
                  aria-label={`Add ${m} minutes`}
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
                placeholder="Enter minutes"
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
              Notes <span className="normal-case font-normal text-[var(--color-text-light)]">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations or notes..."
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
                <span>Saving…</span>
              ) : (
                <>
                  <ClipboardList className="w-5 h-5" />
                  Save Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

