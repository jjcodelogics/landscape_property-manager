'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zone } from '@/lib/types';
import { X } from 'lucide-react';

const ZONE_TYPE_LABELS: Record<string, string> = {
  grass: 'Grass',
  waste: 'Waste',
  maintenance: 'Maintenance',
};

const ZONE_TYPE_COLORS: Record<string, string> = {
  grass: 'bg-green-100 text-green-800',
  waste: 'bg-orange-100 text-orange-800',
  maintenance: 'bg-blue-100 text-blue-800',
};

interface SidebarProps {
  zone: Zone | null;
  onClose: () => void;
  onLogTask: () => void;
}

export default function Sidebar({ zone, onClose, onLogTask }: SidebarProps) {
  if (!zone) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[1000] flex flex-col">
      <div className="flex items-start justify-between p-4 border-b bg-gray-50">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{zone.name}</h2>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-sm font-medium ${
              ZONE_TYPE_COLORS[zone.type] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {ZONE_TYPE_LABELS[zone.type] || zone.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-3 p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {zone.instructions ? (
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {zone.instructions}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-400 italic text-sm">No instructions provided.</p>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={onLogTask}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-base active:scale-95"
        >
          Log Task
        </button>
      </div>
    </div>
  );
}
