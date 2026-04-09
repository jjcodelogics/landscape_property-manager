'use client';

import { useState, useEffect } from 'react';
import { TaskWithZone, TaskType, WeatherCondition, DifficultyLevel } from '@/lib/types';
import { ArrowLeft, Scissors, Trash2, Wrench, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TaskEditModal from '@/components/TaskEditModal';

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: React.ReactNode }> = {
  mowing:      { label: 'Maaien',     icon: <Scissors className="w-4 h-4" /> },
  waste:       { label: 'Afval',      icon: <Trash2   className="w-4 h-4" /> },
  maintenance: { label: 'Onderhoud', icon: <Wrench   className="w-4 h-4" /> },
};

const WEATHER_EMOJI: Record<WeatherCondition, string> = {
  good:   '☀️',
  normal: '🌤️',
  bad:    '🌧️',
};

const DIFFICULTY_EMOJI: Record<DifficultyLevel, string> = {
  normal: '🟢',
  dirty:  '🟡',
  heavy:  '🔴',
};

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithZone | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    setSelectedTask(null);
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    setSelectedTask(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Vandaag ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Gisteren ${date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('nl-NL', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Taken laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors"
            aria-label="Terug"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Taakgeschiedenis</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{tasks.length} taken geregistreerd</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-[var(--color-danger)] font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="p-4 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-[var(--color-text-light)] mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)]">Nog geen taken geregistreerd</p>
          </div>
        ) : (
          tasks.map((task) => {
            const taskConfig = TASK_TYPE_CONFIG[task.task_type];
            const zoneName = task.zones?.title || task.zones?.name || 'Onbekende zone';
            
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 active:bg-[var(--color-bg)] transition-colors cursor-pointer"
              >
                {/* Zone name & time */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-[var(--color-text)] flex-1">{zoneName}</h3>
                  <span className="text-xs text-[var(--color-text-light)] ml-2 whitespace-nowrap">
                    {formatDate(task.created_at)}
                  </span>
                </div>

                {/* Task type & duration */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5 text-[var(--color-primary)]">
                    {taskConfig.icon}
                    <span className="font-semibold text-sm">{taskConfig.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{task.duration_minutes} min</span>
                  </div>
                </div>

                {/* Metadata row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Productive/Non-productive */}
                  {task.mode && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        task.mode === 'productive'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {task.mode === 'productive' ? '⚡ Productief' : '⏸ Niet-productief'}
                    </span>
                  )}

                  {/* Weather */}
                  {task.weather_condition && (
                    <span className="text-sm">
                      {WEATHER_EMOJI[task.weather_condition]}
                    </span>
                  )}

                  {/* Difficulty */}
                  {task.difficulty && (
                    <span className="text-sm">
                      {DIFFICULTY_EMOJI[task.difficulty]}
                    </span>
                  )}
                </div>

                {/* Notes */}
                {task.notes && (
                  <p className="text-sm text-[var(--color-text-muted)] mt-2 line-clamp-2">
                    {task.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {selectedTask && (
        <TaskEditModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={handleTaskUpdated}
          onDelete={handleTaskDeleted}
        />
      )}
    </div>
  );
}
