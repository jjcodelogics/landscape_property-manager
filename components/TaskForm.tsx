'use client';

import { useState } from 'react';
import { Zone, TaskType } from '@/lib/types';
import { X } from 'lucide-react';

interface TaskFormProps {
  zone: Zone;
  onClose: () => void;
  onSuccess: () => void;
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'mowing', label: 'Mowing' },
  { value: 'waste', label: 'Waste Collection' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function TaskForm({ zone, onClose, onSuccess }: TaskFormProps) {
  const [taskType, setTaskType] = useState<TaskType>('mowing');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between p-4 sm:p-5 border-b flex-shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Log Task</h3>
            <p className="text-sm text-gray-600 mt-0.5">{zone.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 overflow-y-auto overscroll-contain flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">
              Task Type
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {TASK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setTaskType(type.value)}
                  className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all active:scale-95 touch-manipulation min-h-[44px] ${
                    taskType === type.value
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              inputMode="numeric"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all touch-manipulation"
              required
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 resize-none transition-all touch-manipulation"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-4 rounded-xl font-medium">{error}</p>
          )}

          <div className="pb-safe pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-all text-base sm:text-lg shadow-lg active:scale-[0.98] touch-manipulation min-h-[52px]"
            >
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
