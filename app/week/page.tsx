'use client';

import { useState, useEffect, useMemo } from 'react';
import { TaskWithZone, PlannedTaskWithZone, DayConfig, TaskType, ZoneType } from '@/lib/types';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Scissors, Trash2, Wrench, Plus, X, Users, Clock, Edit2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ZonePlanModal from '@/components/ZonePlanModal';
import PlannedTaskEditModal from '@/components/PlannedTaskEditModal';

const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: React.ReactNode; color: string }> = {
  mowing:      { label: 'Maaien',     icon: <Scissors className="w-4 h-4" />, color: 'text-green-600' },
  maintenance: { label: 'Onderhoud', icon: <Wrench   className="w-4 h-4" />, color: 'text-orange-600' },
};

const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  grass:       'bg-[var(--color-zone-grass)]',
  maintenance: 'bg-[var(--color-zone-maintenance)]',
};

const DAY_NAMES = ['Zon', 'Maa', 'Din', 'Woe', 'Don', 'Vrij', 'Zat'];
const DAY_NAMES_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

interface DayData {
  date: Date;
  dateStr: string;
  dayName: string;
  dayNameFull: string;
  tasks: TaskWithZone[];
  plannedTasks: PlannedTaskWithZone[];
  totalMinutes: number;
  totalPlannedMinutes: number;
  totalPlannedWorkload: number;
}

export default function WeekCalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithZone[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTaskWithZone[]>([]);
  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedDateForPlan, setSelectedDateForPlan] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlannedTask, setSelectedPlannedTask] = useState<PlannedTaskWithZone | null>(null);

  useEffect(() => {
    fetchWeekTasks();
    fetchPlannedTasks();
    fetchDayConfigs();
  }, [currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Adjust to Monday: if Sunday (0), go back 6 days; otherwise go back to Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  function formatDateForAPI(date: Date): string {
    const isoString = date.toISOString();
    const datePart = isoString.split('T')[0];
    return datePart!; // Always defined for valid ISO string
  }

  const fetchWeekTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const weekEnd = getWeekEnd(currentWeekStart);
      const startDate = formatDateForAPI(currentWeekStart);
      const endDate = formatDateForAPI(weekEnd);

      const response = await fetch(`/api/tasks/weekly?start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlannedTasks = async () => {
    try {
      const weekEnd = getWeekEnd(currentWeekStart);
      const startDate = formatDateForAPI(currentWeekStart);
      const endDate = formatDateForAPI(weekEnd);

      const response = await fetch(`/api/planned-tasks?start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch planned tasks');
      
      const data = await response.json();
      setPlannedTasks(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching planned tasks:', err);
      // Don't set error state for planned tasks - they're optional
    }
  };

  const fetchDayConfigs = async () => {
    try {
      const weekEnd = getWeekEnd(currentWeekStart);
      const startDate = formatDateForAPI(currentWeekStart);
      const endDate = formatDateForAPI(weekEnd);

      const response = await fetch(`/api/day-config?start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) throw new Error('Failed to fetch day configs');
      
      const data = await response.json();
      setDayConfigs(data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching day configs:', err);
      // Don't set error state for day configs - they're optional
    }
  };

  // Compute weekly data from tasks and planned tasks
  const weeklyData = useMemo(() => {
    const data: DayData[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateForAPI(date);
      
      // Filter tasks for this day
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return formatDateForAPI(taskDate) === dateStr;
      });
      
      // Filter planned tasks for this day
      const dayPlannedTasks = plannedTasks.filter(planned => planned.date === dateStr);

      // Calculate total minutes
      const totalMinutes = dayTasks.reduce((sum, task) => sum + task.duration_minutes, 0);
      const totalPlannedMinutes = dayPlannedTasks.reduce((sum, planned) => sum + planned.estimated_minutes, 0);
      const totalPlannedWorkload = dayPlannedTasks.reduce((sum, planned) => {
        const teamMembers = planned.team_members || 1;
        return sum + (planned.estimated_minutes * teamMembers);
      }, 0);

      data.push({
        date,
        dateStr,
        dayName: DAY_NAMES[date.getDay()]!,
        dayNameFull: DAY_NAMES_FULL[date.getDay()]!,
        tasks: dayTasks,
        plannedTasks: dayPlannedTasks,
        totalMinutes,
        totalPlannedMinutes,
        totalPlannedWorkload,
      });
    }

    return data;
  }, [currentWeekStart, tasks, plannedTasks]);

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleAddPlan = (dateStr: string) => {
    setSelectedDateForPlan(dateStr);
    setShowPlanModal(true);
  };

  const handleZoneSelected = async (zoneId: string) => {
    if (!selectedDateForPlan) return;

    try {
      const response = await fetch('/api/planned-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDateForPlan,
          zone_id: zoneId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create plan');
      }

      // Refresh planned tasks
      await fetchPlannedTasks();
    } catch (err) {
      console.error('Error creating plan:', err);
      alert(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  const handleDeletePlanned = async (plannedId: string) => {
    if (!confirm('Deze planning verwijderen?')) return;

    try {
      const response = await fetch(`/api/planned-tasks/${plannedId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete planned task');
      }

      // Refresh planned tasks
      await fetchPlannedTasks();
    } catch (err) {
      console.error('Error deleting planned task:', err);
      alert('Failed to delete planned task');
    }
  };

  const handleEditPlanned = (plannedTask: PlannedTaskWithZone) => {
    setSelectedPlannedTask(plannedTask);
    setShowEditModal(true);
  };

  const handleSavePlannedTask = async (
    id: string,
    updates: {
      estimated_minutes?: number;
      team_members?: number;
      notes?: string;
    }
  ) => {
    try {
      const response = await fetch(`/api/planned-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update planned task');
      }

      // Refresh planned tasks
      await fetchPlannedTasks();
    } catch (err) {
      console.error('Error updating planned task:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleDeletePlannedFromModal = async (id: string) => {
    try {
      const response = await fetch(`/api/planned-tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete planned task');
      }

      // Refresh planned tasks
      await fetchPlannedTasks();
    } catch (err) {
      console.error('Error deleting planned task:', err);
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleUpdateDayConfig = async (dateStr: string, teamMembers: number, hoursPerMember: number) => {
    try {
      const response = await fetch('/api/day-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          team_members: teamMembers,
          hours_per_member: hoursPerMember,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update day config');
      }

      // Refresh day configs
      await fetchDayConfigs();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating day config:', err);
      alert(err instanceof Error ? err.message : 'Failed to update day config');
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}m` : `${hours}u`;
  };

  const isCurrentWeek = useMemo(() => {
    const now = new Date();
    const thisWeekStart = getWeekStart(now);
    return currentWeekStart.getTime() === thisWeekStart.getTime();
  }, [currentWeekStart]);

  const weekLabel = useMemo(() => {
    const weekEnd = getWeekEnd(currentWeekStart);
    const startMonth = currentWeekStart.toLocaleDateString('nl-NL', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('nl-NL', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${currentWeekStart.getDate()}-${weekEnd.getDate()} ${startMonth}`;
    }
    return `${currentWeekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth}`;
  }, [currentWeekStart]);

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Week laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors flex-shrink-0"
            aria-label="Terug"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-semibold text-[var(--color-text)] truncate">Week Overzicht</h1>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="px-2 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-t border-[var(--color-border)]">
          {/* Previous Week Button */}
          <button
            onClick={handlePreviousWeek}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-border)] active:bg-[var(--color-border)] transition-colors min-h-[40px] min-w-[40px] sm:min-w-0"
            aria-label="Vorige week"
          >
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium">Vorige</span>
          </button>

          {/* Week Label & Today Button */}
          <div className="flex flex-col items-center justify-center min-w-0 flex-1">
            <div className="text-sm sm:text-base font-semibold text-[var(--color-text)] whitespace-nowrap">{weekLabel}</div>
            {!isCurrentWeek && (
              <button
                onClick={handleToday}
                className="text-xs text-[var(--color-primary)] hover:underline mt-0.5 whitespace-nowrap"
              >
                Vandaag
              </button>
            )}
          </div>

          {/* Next Week Button */}
          <button
            onClick={handleNextWeek}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-lg bg-[var(--color-bg)] hover:bg-[var(--color-border)] active:bg-[var(--color-border)] transition-colors min-h-[40px] min-w-[40px] sm:min-w-0"
            aria-label="Volgende week"
          >
            <span className="hidden sm:inline text-sm font-medium">Volgende</span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile: Scrollable Days */}
      <div className="md:hidden overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-min">
          {weeklyData.map((day) => (
            <DayCard 
              key={day.dateStr} 
              day={day} 
              formatDuration={formatDuration}
              onAddPlan={handleAddPlan}
              onEditPlanned={handleEditPlanned}
              onDeletePlanned={handleDeletePlanned}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden md:grid md:grid-cols-5 gap-4 p-4">
        {weeklyData.slice(1, 6).map((day) => ( // Mon-Fri only for desktop
          <DayCard 
            key={day.dateStr} 
            day={day} 
            formatDuration={formatDuration}
            onAddPlan={handleAddPlan}
            onEditPlanned={handleEditPlanned}
            onDeletePlanned={handleDeletePlanned}
          />
        ))}
      </div>

      {/* Zone Plan Modal */}
      <ZonePlanModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setSelectedDateForPlan(null);
        }}
        onZoneSelected={handleZoneSelected}
        selectedDate={selectedDateForPlan || ''}
        alreadyPlannedZoneIds={
          selectedDateForPlan 
            ? plannedTasks.filter(p => p.date === selectedDateForPlan).map(p => p.zone_id)
            : []
        }
      />

      {/* Planned Task Edit Modal */}
      <PlannedTaskEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPlannedTask(null);
        }}
        plannedTask={selectedPlannedTask}
        onSave={handleSavePlannedTask}
        onDelete={handleDeletePlannedFromModal}
      />
    </div>
  );
}

// DayCard Component
interface DayCardProps {
  day: DayData;
  formatDuration: (minutes: number) => string;
  onAddPlan: (dateStr: string) => void;
  onEditPlanned: (planned: PlannedTaskWithZone) => void;
  onDeletePlanned: (id: string) => void;
}

function DayCard({ day, formatDuration, onAddPlan, onEditPlanned, onDeletePlanned }: DayCardProps) {
  const isToday = useMemo(() => {
    const today = new Date();
    return day.date.toDateString() === today.toDateString();
  }, [day.date]);
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  const hasPlannedTasks = day.plannedTasks.length > 0;
  const hasCompletedTasks = day.tasks.length > 0;

  return (
    <div
      className={`bg-[var(--color-surface)] rounded-lg border overflow-hidden ${
        isToday ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-opacity-20' : 'border-[var(--color-border)]'
      }`}
    >
      {/* Day Header */}
      <div className={`p-3 border-b border-[var(--color-border)] ${isToday ? 'bg-[var(--color-primary)] bg-opacity-5' : ''}`}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className={`text-xs font-medium ${isWeekend ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-light)]'}`}>
              {day.dayNameFull}
            </div>
            <div className={`text-lg font-semibold ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
              {day.date.getDate()} {day.date.toLocaleDateString('nl-NL', { month: 'short' })}
            </div>
          </div>
          <div className="text-right">
            {day.totalPlannedMinutes > 0 && (
              <div className="text-xs text-[var(--color-text-muted)]">
                <div>Duur: {formatDuration(day.totalPlannedMinutes)}</div>
                {day.totalPlannedWorkload !== day.totalPlannedMinutes && (
                  <div className="font-semibold text-blue-600">Werk: {formatDuration(day.totalPlannedWorkload)}</div>
                )}
              </div>
            )}
            {day.totalMinutes > 0 && (
              <div className="text-sm font-semibold text-[var(--color-success)] mt-1">
                ✓ {formatDuration(day.totalMinutes)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-3">
        {/* Planned Tasks Section */}
        {hasPlannedTasks && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                Gepland
              </h4>
            </div>
            <div className="space-y-2">
              {day.plannedTasks.map((planned) => (
                <PlannedTaskCard 
                  key={planned.id} 
                  planned={planned} 
                  formatDuration={formatDuration}
                  onEdit={onEditPlanned}
                  onDelete={onDeletePlanned}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks Section */}
        {hasCompletedTasks && (
          <div className={hasPlannedTasks ? 'pt-4 border-t border-[var(--color-border)]' : ''}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                Voltooid
              </h4>
            </div>
            <div className="space-y-2">
              {day.tasks.map((task) => (
                <TaskCard key={task.id} task={task} formatDuration={formatDuration} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State or Add Button */}
        {!hasPlannedTasks && !hasCompletedTasks && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Geen taken</p>
        )}
        
        {/* Add Plan Button */}
        <button
          onClick={() => onAddPlan(day.dateStr)}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:bg-opacity-5 transition-colors text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
        >
          <Plus className="w-4 h-4" />
          <span>Zone plannen</span>
        </button>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: TaskWithZone;
  formatDuration: (minutes: number) => string;
}

function TaskCard({ task, formatDuration }: TaskCardProps) {
  const taskConfig = TASK_TYPE_CONFIG[task.task_type];
  const zoneName = task.zones?.title || 'Onbekend';
  const zoneType = task.zones?.type || 'grass';
  const zoneColor = ZONE_TYPE_COLORS[zoneType];

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-bg)] transition-colors opacity-75">
      {/* Zone Color Indicator */}
      <div className={`w-1 h-full ${zoneColor} rounded-full flex-shrink-0 mt-1`} />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`${taskConfig.color} flex-shrink-0 opacity-60`}>{taskConfig.icon}</span>
          <span className="text-sm font-medium text-[var(--color-text)] truncate">{zoneName}</span>
          <span className="text-xs text-[var(--color-success)] ml-auto">✓</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>{taskConfig.label}</span>
          <span>•</span>
          <span className="font-medium text-[var(--color-success)]">{formatDuration(task.duration_minutes)}</span>
        </div>
      </div>
    </div>
  );
}

interface PlannedTaskCardProps {
  planned: PlannedTaskWithZone;
  formatDuration: (minutes: number) => string;
  onEdit: (planned: PlannedTaskWithZone) => void;
  onDelete: (plannedId: string) => void;
}

function PlannedTaskCard({ planned, formatDuration, onEdit, onDelete }: PlannedTaskCardProps) {
  const zoneName = planned.zones?.title || 'Onbekend';
  const zoneType = planned.zones?.type || 'grass';
  const zoneColor = ZONE_TYPE_COLORS[zoneType];
  const typeConfig = TASK_TYPE_CONFIG[zoneType === 'grass' ? 'mowing' : 'maintenance'];
  const teamMembers = planned.team_members || 1;
  const workloadMinutes = planned.estimated_minutes * teamMembers;

  return (
    <div 
      onClick={() => onEdit(planned)}
      className="flex items-start gap-2 p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm transition-all group cursor-pointer"
    >
      {/* Zone Color Indicator */}
      <div className={`w-1 h-full ${zoneColor} rounded-full flex-shrink-0 mt-1`} />

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`${typeConfig.color} flex-shrink-0`}>{typeConfig.icon}</span>
          <span className="text-sm font-medium text-[var(--color-text)] truncate">{zoneName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{formatDuration(planned.estimated_minutes)}</span>
          </span>
          {teamMembers > 1 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{teamMembers}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-blue-600">{formatDuration(workloadMinutes)} werklast</span>
            </>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(planned.id);
        }}
        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-opacity flex-shrink-0"
        aria-label="Verwijderen"
      >
        <X className="w-3.5 h-3.5 text-red-600" />
      </button>
    </div>
  );
}
