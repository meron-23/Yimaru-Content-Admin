import React, { useState, useMemo } from 'react';
import type { ContentItem, ContentType } from '../types/content';
import { CONTENT_TYPE_METADATA } from '../utils/telegramTemplates';
import { CheckCircle2, Search, Eye, Copy, Calendar } from 'lucide-react';

interface PublishedViewProps {
  items: ContentItem[];
  onPreviewItem: (item: ContentItem) => void;
  onDuplicate: (id: string) => Promise<void>;
}

export const PublishedView: React.FC<PublishedViewProps> = ({
  items,
  onPreviewItem,
  onDuplicate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'ALL'>('ALL');

  const publishedItems = useMemo(() => {
    return items
      .filter(i => i.status === 'PUBLISHED')
      .filter(i => {
        if (selectedType !== 'ALL' && i.contentType !== selectedType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return i.title.toLowerCase().includes(q) || i.word?.toLowerCase().includes(q) || i.phrase?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime());
  }, [items, searchQuery, selectedType]);

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Channel Publication History</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Published Content Archive
          </h2>
          <p className="text-xs text-slate-500">
            Historical record of lessons published to your Yimaru audience.
          </p>
        </div>

        <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
          {publishedItems.length} Lessons Published
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search published lessons by keyword..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Content Types</option>
            {(Object.keys(CONTENT_TYPE_METADATA) as ContentType[]).map(type => (
              <option key={type} value={type}>
                {CONTENT_TYPE_METADATA[type].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Published Items List */}
      {publishedItems.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 opacity-40" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No published posts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once scheduled posts reach their scheduled time, they appear here in your published history archive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedItems.map(item => {
            const typeMeta = CONTENT_TYPE_METADATA[item.contentType];
            const pubDate = new Date(item.publishedAt || item.updatedAt);

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: typeMeta?.bg, color: typeMeta?.color }}
                    >
                      {typeMeta?.label || item.contentType}
                    </span>

                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{pubDate.toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {item.definition || item.meaning || item.caption || item.description || ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Approved by {item.approvedBy || 'Admin'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onDuplicate(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition"
                      title="Duplicate as new draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
