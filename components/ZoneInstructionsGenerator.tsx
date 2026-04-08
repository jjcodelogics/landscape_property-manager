'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zone } from '@/lib/types';
import { X, FileText, CheckSquare, Square, Copy, Check } from 'lucide-react';

interface ZoneInstructionsGeneratorProps {
  zones: Zone[];
  onClose: () => void;
}

export default function ZoneInstructionsGenerator({ zones, onClose }: ZoneInstructionsGeneratorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectedZones = zones.filter((z) => selectedIds.includes(z.id));

  const combinedText = selectedZones
    .map((z) => {
      const header = `# ${z.title}${z.name && z.name !== z.title ? ` — ${z.name}` : ''}`;
      const meta = [
        z.area_m2 ? `📐 Area: ${z.area_m2.toLocaleString()} m²` : null,
        z.tags?.length ? `🏷️ Tags: ${z.tags.map((t) => `#${t}`).join(', ')}` : null,
      ].filter(Boolean).join('  \n');
      const instructions = z.instructions || '_No instructions provided._';
      return [header, meta, instructions].filter(Boolean).join('\n\n');
    })
    .join('\n\n---\n\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combinedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  const ZONE_TYPE_BADGE: Record<string, string> = {
    grass: 'badge-grass',
    waste: 'badge-waste',
    maintenance: 'badge-maintenance',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-[var(--color-surface)] rounded-t-[1.5rem] sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92vh] flex flex-col animate-slide-in-bottom sm:animate-fade-in">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-bold text-[var(--color-text)]">Zoneinstructies</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors touch-manipulation" aria-label="Close">
            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Zone selector */}
          <div className="sm:w-56 flex-shrink-0 overflow-y-auto" style={{ borderRight: '1px solid var(--color-border)' }}>
            <p className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] sticky top-0 bg-[var(--color-surface-2)]" style={{ borderBottom: '1px solid var(--color-border)' }}>
              Selecteer Zones
            </p>
            <ul className="p-2 space-y-1">
              {zones.map((zone) => {
                const selected = selectedIds.includes(zone.id);
                return (
                  <li
                    key={zone.id}
                    onClick={() => toggle(zone.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border-2 transition-all touch-manipulation ${
                      selected
                        ? 'border-[var(--color-secondary)] bg-[rgba(10,147,150,0.06)]'
                        : 'border-transparent hover:bg-[var(--color-bg)]'
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="w-4 h-4 flex-shrink-0 text-[var(--color-secondary)]" />
                    ) : (
                      <Square className="w-4 h-4 flex-shrink-0 text-[var(--color-text-light)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{zone.title}</p>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold mt-0.5 ${ZONE_TYPE_BADGE[zone.type]}`}>
                        {zone.type}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                {selectedIds.length} zone{selectedIds.length !== 1 ? 's' : ''} geselecteerd
              </p>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Gekopieerd!' : 'Alles Kopiëren'}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {selectedIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <FileText className="w-10 h-10 mb-3 text-[var(--color-text-light)]" />
                  <p className="text-[var(--color-text-light)] italic text-sm">Selecteer zones aan de linkerkant om hun gecombineerde instructies te bekijken.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {selectedZones.map((zone, idx) => (
                    <div key={zone.id}>
                      {idx > 0 && <hr style={{ borderColor: 'var(--color-border)' }} className="mb-8" />}
                      <div className="mb-3">
                        <h2 className="text-base font-bold text-[var(--color-text)]">{zone.title}</h2>
                        {zone.name && zone.name !== zone.title && (
                          <p className="text-sm text-[var(--color-text-muted)]">{zone.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ZONE_TYPE_BADGE[zone.type]}`}>{zone.type}</span>
                          {zone.area_m2 ? <span className="text-xs text-[var(--color-text-muted)]">📐 {zone.area_m2.toLocaleString()} m²</span> : null}
                          {zone.tags?.map((t) => (
                            <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(10,147,150,0.1)', color: 'var(--color-secondary)' }}>#{t}</span>
                          ))}
                        </div>
                      </div>
                      {zone.instructions ? (
                        <div className="zone-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{zone.instructions}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-[var(--color-text-light)] italic text-sm">No instructions provided.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
