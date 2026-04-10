'use client';

import { useState, useEffect, useMemo } from 'react';
import { Zone, ZoneType } from '@/lib/types';
import { X, Search, Scissors, Trash2, Wrench, Tag, Loader2 } from 'lucide-react';

const ZONE_TYPE_CONFIG: Record<ZoneType, { label: string; icon: React.ReactNode; color: string }> = {
  grass:       { label: 'Grasonderhoud', icon: <Scissors className="w-4 h-4" />, color: 'text-green-600' },
  waste:       { label: 'Afvalbeheer',   icon: <Trash2   className="w-4 h-4" />, color: 'text-blue-600' },
  maintenance: { label: 'Onderhoud',    icon: <Wrench   className="w-4 h-4" />, color: 'text-orange-600' },
};

const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  grass:       'bg-[var(--color-zone-grass)]',
  waste:       'bg-[var(--color-zone-waste)]',
  maintenance: 'bg-[var(--color-zone-maintenance)]',
};

interface ZonePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZoneSelected: (zoneId: string) => void;
  selectedDate: string;
  alreadyPlannedZoneIds: string[];
}

export default function ZonePlanModal({ 
  isOpen, 
  onClose, 
  onZoneSelected, 
  selectedDate,
  alreadyPlannedZoneIds 
}: ZonePlanModalProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ZoneType | 'all'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchZones();
      setSearchQuery('');
    }
  }, [isOpen]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/zones');
      if (!response.ok) throw new Error('Failed to fetch zones');
      const data = await response.json();
      setZones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredZones = useMemo(() => {
    return zones.filter(zone => {
      // Filter out already planned zones
      if (alreadyPlannedZoneIds.includes(zone.id)) return false;

      // Filter by type
      if (selectedType !== 'all' && zone.type !== selectedType) return false;

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = zone.title.toLowerCase().includes(query);
        const matchesName = zone.name?.toLowerCase().includes(query);
        const matchesTags = zone.tags?.some(tag => tag.toLowerCase().includes(query));
        
        return matchesTitle || matchesName || matchesTags;
      }

      return true;
    });
  }, [zones, searchQuery, selectedType, alreadyPlannedZoneIds]);

  const handleZoneClick = (zoneId: string) => {
    onZoneSelected(zoneId);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[2000] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[2001]">
        <div className="bg-[var(--color-surface)] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col animate-slide-in-bottom sm:animate-scale-in shadow-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-[var(--color-text)]">Zone plannen</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
                aria-label="Sluiten"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {formatDate(selectedDate)}
            </p>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Zoek op naam, locatie of tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>

            {/* Type Filters */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === 'all'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                }`}
              >
                Alle
              </button>
              {(Object.keys(ZONE_TYPE_CONFIG) as ZoneType[]).map((type) => {
                const config = ZONE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === type
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                    }`}
                  >
                    {config.icon}
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--color-text-muted)]">
                  {searchQuery ? 'Geen zones gevonden' : 'Alle zones zijn al gepland'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredZones.map((zone) => {
                  const typeConfig = ZONE_TYPE_CONFIG[zone.type];
                  const zoneColor = ZONE_TYPE_COLORS[zone.type];

                  return (
                    <button
                      key={zone.id}
                      onClick={() => handleZoneClick(zone.id)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-bg)] active:bg-[var(--color-border)] transition-colors text-left"
                    >
                      {/* Color Indicator */}
                      <div className={`w-1 h-full ${zoneColor} rounded-full flex-shrink-0 mt-1`} />

                      {/* Zone Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${typeConfig.color} flex-shrink-0`}>
                            {typeConfig.icon}
                          </span>
                          <span className="font-semibold text-[var(--color-text)] truncate">
                            {zone.title}
                          </span>
                        </div>
                        {zone.name && (
                          <p className="text-sm text-[var(--color-text-muted)] truncate">
                            {zone.name}
                          </p>
                        )}
                        {zone.tags && zone.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Tag className="w-3 h-3 text-[var(--color-text-light)]" />
                            {zone.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{ background: 'rgba(10,147,150,0.12)', color: 'var(--color-secondary)' }}
                              >
                                #{tag}
                              </span>
                            ))}
                            {zone.tags.length > 3 && (
                              <span className="text-xs text-[var(--color-text-muted)]">
                                +{zone.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
