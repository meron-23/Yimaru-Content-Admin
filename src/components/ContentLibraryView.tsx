import React, { useState, useMemo } from 'react';
import type { ContentItem, ContentStatus, ContentType, FilterState } from '../types/content';
import { CONTENT_TYPE_METADATA } from '../utils/telegramTemplates';
import { STATUS_METADATA } from '../utils/workflow';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Send, 
  CheckCircle, 
  Calendar, 
  Copy, 
  Trash2, 
  RotateCcw, 
  LayoutGrid, 
  List, 
  X
} from 'lucide-react';

interface ContentLibraryViewProps {
  items: ContentItem[];
  onOpenCreate: () => void;
  onEditItem: (item: ContentItem) => void;
  onPreviewItem: (item: ContentItem) => void;
  onReviewItem: (item: ContentItem) => void;
  onScheduleItem: (item: ContentItem) => void;
  onSubmitForApproval: (id: string) => Promise<void>;
  onPublishNow: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({
  items,
  onOpenCreate,
  onEditItem,
  onPreviewItem,
  onReviewItem,
  onScheduleItem,
  onSubmitForApproval,
  onDuplicate,
  onRestore,
  onArchive
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    contentType: 'ALL',
    status: 'ALL',
    dateRange: 'ALL',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  // Filter & Search Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesWord = item.word?.toLowerCase().includes(query);
        const matchesPhrase = item.phrase?.toLowerCase().includes(query);
        const matchesTerm = item.term?.toLowerCase().includes(query);
        const matchesDef = item.definition?.toLowerCase().includes(query) || item.meaning?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesWord && !matchesPhrase && !matchesTerm && !matchesDef) {
          return false;
        }
      }

      // 2. Content Type Filter
      if (filters.contentType !== 'ALL' && item.contentType !== filters.contentType) {
        return false;
      }

      // 3. Status Filter
      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const fieldA = a[filters.sortBy] || a.createdAt;
      const fieldB = b[filters.sortBy] || b.createdAt;
      const timeA = new Date(fieldA as string).getTime();
      const timeB = new Date(fieldB as string).getTime();

      return filters.sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [items, filters]);

  const activeFilterCount = (filters.contentType !== 'ALL' ? 1 : 0) + (filters.status !== 'ALL' ? 1 : 0) + (filters.searchQuery ? 1 : 0);

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      contentType: 'ALL',
      status: 'ALL',
      dateRange: 'ALL',
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Educational Content Library
          </h2>
          <p className="text-xs text-slate-500">
            Manage, review, approve, schedule, and preview channel posts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#9A288D] hover:bg-[#812175] text-white text-xs font-bold shadow-md shadow-[#9A288D]/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Content</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Control Panel */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Box (6 cols) */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search content..."
              value={filters.searchQuery}
              onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content Type Selector (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={filters.contentType}
              onChange={e => setFilters(prev => ({ ...prev, contentType: e.target.value as any }))}
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

          {/* Status Filter (3 cols) */}
          <div className="sm:col-span-3">
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              {(Object.keys(STATUS_METADATA) as ContentStatus[]).map(st => (
                <option key={st} value={st}>
                  {STATUS_METADATA[st].label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filter Pills Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-semibold">Active Filters:</span>
            
            {filters.contentType !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold border border-[var(--brand-primary)]/30 flex items-center gap-1">
                {CONTENT_TYPE_METADATA[filters.contentType]?.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, contentType: 'ALL' }))} />
              </span>
            )}

            {filters.status !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                {STATUS_METADATA[filters.status]?.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, status: 'ALL' }))} />
              </span>
            )}

            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Content Library Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>Showing {filteredItems.length} of {items.length} items</span>
      </div>

      {/* View Render: Table or Card Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Filter className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No content matches your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new lesson for the channel.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Title & Details</th>
                <th className="py-3.5 px-4">Content Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Scheduled / Pub Date</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map(item => {
                const statusMeta = STATUS_METADATA[item.status];
                const typeMeta = CONTENT_TYPE_METADATA[item.contentType];

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    
                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        {item.word ? `Word: ${item.word}` : item.phrase ? `Phrase: "${item.phrase}"` : item.term ? `Term: ${item.term}` : item.definition || item.description || ''}
                      </div>
                    </td>

                    {/* Content Type */}
                    <td className="py-3.5 px-4">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5"
                        style={{ backgroundColor: typeMeta?.bg, color: typeMeta?.color }}
                      >
                        {typeMeta?.label || item.contentType}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Scheduled / Published Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {item.scheduledAt ? (
                        <div className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(item.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ) : item.publishedAt ? (
                        <div className="text-emerald-600 dark:text-emerald-400">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Contextual Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Always visible: Preview */}
                        <button
                          onClick={() => onPreviewItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Preview Yimaru Post"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Status-specific actions */}
                        {item.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => onEditItem(item)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onSubmitForApproval(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <Send className="w-3 h-3" />
                              <span>Submit</span>
                            </button>
                          </>
                        )}

                        {item.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => onReviewItem(item)}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-1 shadow"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        )}

                        {item.status === 'APPROVED' && (
                          <button
                            onClick={() => onScheduleItem(item)}
                            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 shadow"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule</span>
                          </button>
                        )}

                        {item.status === 'SCHEDULED' && (
                          <button
                            onClick={() => onScheduleItem(item)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800"
                          >
                            Reschedule
                          </button>
                        )}

                        {item.status === 'PUBLISHED' && (
                          <button
                            onClick={() => onDuplicate(item.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1"
                            title="Duplicate post as new draft"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Duplicate</span>
                          </button>
                        )}

                        {item.status === 'REJECTED' && (
                          <button
                            onClick={() => onEditItem(item)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                          >
                            Edit & Fix
                          </button>
                        )}

                        {/* Archive Action */}
                        {item.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => onArchive(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Archive content"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'ARCHIVED' && (
                          <button
                            onClick={() => onRestore(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="Restore to Draft"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

      ) : (

        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const statusMeta = STATUS_METADATA[item.status];
            const typeMeta = CONTENT_TYPE_METADATA[item.contentType];

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: typeMeta?.bg, color: typeMeta?.color }}
                    >
                      {typeMeta?.label || item.contentType}
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                    {item.definition || item.meaning || item.caption || item.description || item.exampleSentence || ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPreviewItem(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Preview Yimaru Post"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {item.status === 'PENDING_APPROVAL' ? (
                      <button
                        onClick={() => onReviewItem(item)}
                        className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        onClick={() => onEditItem(item)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
                      >
                        Edit
                      </button>
                    )}
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
