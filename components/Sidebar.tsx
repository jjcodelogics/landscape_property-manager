'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zone } from '@/lib/types';
import { X, ClipboardList } from 'lucide-react';

const ZONE_TYPE_LABELS: Record<string, string> = {
  grass:       'Grass',
  waste:       'Waste',
  maintenance: 'Maintenance',
};

interface SidebarProps {
  zone: Zone | null;
  onClose: () => void;
  onLogTask: () => void;
}

export default function Sidebar({ zone, onClose, onLogTask }: SidebarProps) {
  if (!zone) return null;

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

