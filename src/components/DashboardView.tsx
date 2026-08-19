import React from 'react';
import type { ContentItem, ContentType } from '../types/content';
import { CONTENT_TYPE_METADATA } from '../utils/telegramTemplates';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  CalendarClock, 
  Plus, 
  Eye, 
  Send,
  ArrowRight,
  BarChart3
} from 'lucide-react';

interface DashboardViewProps {
  items: ContentItem[];
  onOpenCreate: () => void;
  onSelectTab: (tab: 'content' | 'upcoming' | 'published') => void;
  onPreviewItem: (item: ContentItem) => void;
  onReviewItem: (item: ContentItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  onOpenCreate,
  onSelectTab,
  onPreviewItem,
  onReviewItem
}) => {
  // Metric Counts
  const totalCount = items.length;
  const draftCount = items.filter(i => i.status === 'DRAFT' || i.status === 'REJECTED').length;
  const pendingCount = items.filter(i => i.status === 'PENDING_APPROVAL').length;
  const scheduledCount = items.filter(i => i.status === 'SCHEDULED').length;
  const publishedCount = items.filter(i => i.status === 'PUBLISHED').length;

  // Upcoming scheduled items sorted by publication date
  const upcomingItems = items
    .filter(i => i.status === 'SCHEDULED' && i.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 4);

  // Recently published items
  const recentPublished = items
    .filter(i => i.status === 'PUBLISHED')
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime())
    .slice(0, 4);

  // Pending Review items
  const pendingItems = items
    .filter(i => i.status === 'PENDING_APPROVAL')
    .slice(0, 4);

  // Content type breakdown
  const typeCounts: Record<ContentType, number> = {
    word_of_day: 0,
    definition: 0,
    phrase: 0,
    informative_photo: 0,
    youtube_resource: 0,
    app_resource: 0
  };

  items.forEach(i => {
    if (typeCounts[i.contentType] !== undefined) {
      typeCounts[i.contentType]++;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* Simple Clean Header matching screenshot */}
      <div className="pt-2 pb-4">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Dashboard
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Everything that needs a hand today.
        </p>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1 */}
        <div 
          onClick={() => onSelectTab('content')}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-l-[6px] border-l-[var(--brand-primary)] p-6 cursor-pointer hover:shadow-md transition flex flex-col justify-center min-h-[120px]"
        >
          <div className="text-[32px] leading-none font-bold text-[var(--brand-primary)] mb-2">{draftCount + pendingCount}</div>
          <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Active content items</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Drafts and pending review</div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => onSelectTab('upcoming')}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-l-[6px] border-l-[var(--brand-accent)] p-6 cursor-pointer hover:shadow-md transition flex flex-col justify-center min-h-[120px]"
        >
          <div className="text-[32px] leading-none font-bold text-amber-500 mb-2">{scheduledCount}</div>
          <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Need action</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scheduled for publication</div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => onSelectTab('published')}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 border-l-[6px] border-l-emerald-600 p-6 cursor-pointer hover:shadow-md transition flex flex-col justify-center min-h-[120px]"
        >
          <div className="text-[32px] leading-none font-bold text-emerald-600 mb-2">{publishedCount}</div>
          <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Content published</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Live on Yimaru</div>
        </div>

      </div>

      {/* Main Dashboard Section Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (7 cols): Upcoming Schedule & Pending Approval Queue */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Pending Review Queue Banner if any */}
          {pendingItems.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Pending Approval Queue ({pendingItems.length})
                  </h3>
                </div>

                <button
                  onClick={() => onSelectTab('content')}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {pendingItems.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {item.contentType.replace('_', ' ')}
                        </span>
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        Submitted {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      onClick={() => onReviewItem(item)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow transition"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Scheduled Posts Feed */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Upcoming Scheduled Posts
                </h3>
              </div>

              <button
                onClick={() => onSelectTab('upcoming')}
                className="text-xs font-semibold text-[var(--brand-primary)] hover:opacity-80 hover:underline flex items-center gap-1"
              >
                <span>Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <CalendarClock className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No posts scheduled for publication yet.</p>
                <button
                  onClick={() => onSelectTab('content')}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Approve and schedule drafts &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingItems.map(item => {
                  const schedDate = new Date(item.scheduledAt!);
                  const isToday = schedDate.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                          isToday ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        }`}>
                          <span className="text-[10px] font-bold uppercase">{schedDate.toLocaleDateString([], { month: 'short' })}</span>
                          <span className="text-base font-extrabold leading-none">{schedDate.getDate()}</span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              {CONTENT_TYPE_METADATA[item.contentType]?.label || item.contentType}
                            </span>
                            {isToday && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white animate-pulse">
                                TODAY
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate mt-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Scheduled at {schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onPreviewItem(item)}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                        title="Preview Yimaru Post"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 cols): Recently Published & Content Breakdown */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Recently Published Feed */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Recently Published
                </h3>
              </div>

              <button
                onClick={() => onSelectTab('published')}
                className="text-xs font-semibold text-[var(--brand-primary)] hover:opacity-80 hover:underline flex items-center gap-1"
              >
                <span>View Archive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentPublished.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No published posts recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentPublished.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Published {new Date(item.publishedAt || item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => onPreviewItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Distribution by Type */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <BarChart3 className="w-5 h-5 text-[var(--brand-primary)]" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Content Types Breakdown
              </h3>
            </div>

            <div className="space-y-3">
              {(Object.keys(CONTENT_TYPE_METADATA) as ContentType[]).map(type => {
                const meta = CONTENT_TYPE_METADATA[type];
                const count = typeCounts[type] || 0;
                const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {count} <span className="text-[11px] font-normal text-slate-400">({percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
