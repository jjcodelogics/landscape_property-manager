'use client';

import { useState, useEffect } from 'react';
import { PlannedTaskWithZone } from '@/lib/types';
import { X, Save, Trash2, Users, Clock } from 'lucide-react';

interface PlannedTaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedTask: PlannedTaskWithZone | null;
  onSave: (id: string, updates: {
    estimated_minutes?: number;
    team_members?: number;
    notes?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PlannedTaskEditModal({
  isOpen,
  onClose,
  plannedTask,
  onSave,
  onDelete,
}: PlannedTaskEditModalProps) {
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [teamMembers, setTeamMembers] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plannedTask) {
      setEstimatedMinutes(plannedTask.estimated_minutes);
      setTeamMembers(plannedTask.team_members || 1);
      setNotes(plannedTask.notes || '');
      setError(null);
    }
  }, [plannedTask]);

  if (!isOpen || !plannedTask) return null;

  const handleSave = async () => {
    if (estimatedMinutes <= 0) {
      setError('Geschatte tijd moet groter dan 0 zijn');
      return;
    }
    if (teamMembers <= 0) {
      setError('Aantal teamleden moet groter dan 0 zijn');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(plannedTask.id, {
        estimated_minutes: estimatedMinutes,
        team_members: teamMembers,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mislukt om op te slaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deze geplande taak verwijderen?')) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(plannedTask.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mislukt om te verwijderen');
    } finally {
      setDeleting(false);
    }
  };

  const workloadMinutes = estimatedMinutes * teamMembers;

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}u ${m}m` : `${h}u`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {plannedTask.zones?.title || plannedTask.zones?.name || 'Zone'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Date (read-only) */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Datum
            </label>
            <div className="px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)]">
              {new Date(plannedTask.date).toLocaleDateString('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {/* Estimated Minutes */}
          <div>
            <label htmlFor="estimated-minutes" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Geschatte Duur</span>
              </div>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEstimatedMinutes(Math.max(15, estimatedMinutes - 15))}
                className="px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] active:bg-[var(--color-border)] transition-colors font-semibold min-w-[44px]"
              >
                -
              </button>
              <input
                id="estimated-minutes"
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)] text-center"
                min="1"
              />
              <button
                onClick={() => setEstimatedMinutes(estimatedMinutes + 15)}
                className="px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] active:bg-[var(--color-border)] transition-colors font-semibold min-w-[44px]"
              >
                +
              </button>
              <div className="text-sm text-[var(--color-text-muted)] min-w-[60px] text-right">
                {formatMinutes(estimatedMinutes)}
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label htmlFor="team-members" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Aantal Teamleden</span>
              </div>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeamMembers(Math.max(1, teamMembers - 1))}
                className="px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] active:bg-[var(--color-border)] transition-colors font-semibold min-w-[44px]"
              >
                -
              </button>
              <input
                id="team-members"
                type="number"
                value={teamMembers}
                onChange={(e) => setTeamMembers(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)] text-center"
                min="1"
              />
              <button
                onClick={() => setTeamMembers(teamMembers + 1)}
                className="px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-border)] active:bg-[var(--color-border)] transition-colors font-semibold min-w-[44px]"
              >
                +
              </button>
              <div className="text-sm text-[var(--color-text-muted)] min-w-[60px] text-right">
                {teamMembers} {teamMembers === 1 ? 'persoon' : 'personen'}
              </div>
            </div>
          </div>

          {/* Workload Display */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-900 font-medium mb-1">Totale Werklast (man-uren)</div>
            <div className="text-2xl font-bold text-blue-700">
              {formatMinutes(workloadMinutes)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {formatMinutes(estimatedMinutes)} × {teamMembers} {teamMembers === 1 ? 'persoon' : 'personen'}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
              Notities (optioneel)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)] resize-none"
              rows={3}
              placeholder="Voeg notities toe..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Verwijderen...' : 'Verwijderen'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2 bg-[var(--color-bg)] hover:bg-[var(--color-border)] active:bg-[var(--color-border)] disabled:bg-gray-200 text-[var(--color-text)] font-medium rounded-lg transition-colors min-h-[44px]"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Opslaan...' : 'Opslaan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
