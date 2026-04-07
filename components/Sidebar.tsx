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
  waste: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
};

interface SidebarProps {
  zone: Zone | null;
  onClose: () => void;
  onLogTask: () => void;
}

export default function Sidebar({ zone, onClose, onLogTask }: SidebarProps) {
  if (!zone) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black/30 z-[999] sm:hidden animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Sidebar - Bottom sheet on mobile, side panel on desktop */}
      <div className="fixed bottom-0 left-0 right-0 sm:top-0 sm:right-0 sm:left-auto sm:bottom-auto h-[85vh] sm:h-full w-full sm:w-96 bg-white shadow-2xl z-[1000] flex flex-col rounded-t-3xl sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-start justify-between p-4 sm:p-5 border-b bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{zone.name}</h2>
            <span
              className={`inline-block mt-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                ZONE_TYPE_COLORS[zone.type] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {ZONE_TYPE_LABELS[zone.type] || zone.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2.5 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 touch-manipulation"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain">
          {zone.instructions ? (
            <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {zone.instructions}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No instructions provided.</p>
          )}
        </div>

        {/* Safe area padding for notched devices */}
        <div className="p-4 sm:p-5 border-t bg-gray-50 pb-safe">
          <button
            onClick={onLogTask}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-4 px-4 rounded-xl transition-colors text-base sm:text-lg shadow-lg active:scale-[0.98] touch-manipulation"
          >
            Log Task
          </button>
        </div>
      </div>
    </>
  );
}
