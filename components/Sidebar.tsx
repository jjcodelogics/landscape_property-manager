'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zone } from '@/lib/types';
import { X, ClipboardList, Edit3, Save, XCircle } from 'lucide-react';

const ZONE_TYPE_LABELS: Record<string, string> = {
  grass:       'Grass',
  waste:       'Waste',
  maintenance: 'Maintenance',
};

interface SidebarProps {
  zone: Zone | null;
  onClose: () => void;
  onLogTask: () => void;
  onZoneUpdated?: () => void;
}

export default function Sidebar({ zone, onClose, onLogTask, onZoneUpdated }: SidebarProps) {
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!zone) return null;

  const handleStartEdit = () => {
    setEditedInstructions(zone.instructions || '');
    setIsEditingInstructions(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingInstructions(false);
    setEditedInstructions('');
    setError(null);
  };

  const handleSaveInstructions = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/zones/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: zone.title,
          name: zone.name,
          type: zone.type,
          instructions: editedInstructions,
          geojson: zone.geojson,
          last_worked_at: zone.last_worked_at,
          next_scheduled_work: zone.next_scheduled_work,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update instructions');
      }

      setIsEditingInstructions(false);
      zone.instructions = editedInstructions; // Update local state
      onZoneUpdated?.(); // Notify parent to refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const badgeClass =
    zone.type === 'grass'
      ? 'badge-grass'
      : zone.type === 'waste'
      ? 'badge-waste'
      : 'badge-maintenance';

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/40 z-[999] sm:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar — bottom sheet on mobile, side panel on desktop */}
      <div
        className="fixed bottom-0 left-0 right-0 sm:top-0 sm:right-0 sm:left-auto sm:bottom-auto
                   h-[88vh] sm:h-full w-full sm:w-96
                   bg-[var(--color-surface)] shadow-2xl z-[1000]
                   flex flex-col rounded-t-[1.5rem] sm:rounded-none
                   animate-slide-in-bottom sm:animate-slide-in-right"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-xl font-bold text-[var(--color-text)] truncate leading-tight">
              {zone.title}
            </h2>
            {zone.name && (
              <p className="text-sm text-[var(--color-text-muted)] truncate mt-0.5">
                {zone.name}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
              >
                {ZONE_TYPE_LABELS[zone.type] || zone.type}
              </span>
            </div>
            {(zone.last_worked_at || zone.next_scheduled_work) && (
              <div className="mt-2 text-xs space-y-0.5">
                {zone.last_worked_at && (
                  <p className="text-[var(--color-text-muted)]">
                    Last worked: {new Date(zone.last_worked_at).toLocaleDateString()}
                  </p>
                )}
                {zone.next_scheduled_work && (
                  <p className="text-[var(--color-secondary)] font-medium">
                    Next scheduled: {new Date(zone.next_scheduled_work).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-full hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors touch-manipulation"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Instructions
            </h3>
            {!isEditingInstructions && (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-secondary)] hover:bg-[var(--color-bg)] transition-colors touch-manipulation"
                aria-label="Edit instructions"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </div>

          {isEditingInstructions ? (
            <div className="space-y-3">
              <textarea
                value={editedInstructions}
                onChange={(e) => setEditedInstructions(e.target.value)}
                className="input resize-none font-mono text-sm"
                rows={12}
                placeholder="## Tasks&#10;- Task 1&#10;&#10;## Notes&#10;- Note 1"
              />
              {error && (
                <p className="text-[var(--color-danger)] text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveInstructions}
                  disabled={saving}
                  className="btn btn-primary flex-1 disabled:opacity-50 text-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="btn btn-ghost text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {zone.instructions ? (
                <div className="zone-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {zone.instructions}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-[var(--color-text-light)] italic text-sm">
                  No instructions provided.
                </p>
              )}
            </>
          )}
        </div>

        {/* Action footer */}
        <div
          className="flex-shrink-0 px-5 py-4 pb-safe"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}
        >
          <button
            onClick={onLogTask}
            className="btn btn-primary w-full text-base"
          >
            <ClipboardList className="w-5 h-5" />
            Log Task
          </button>
        </div>
      </div>
    </>
  );
}

