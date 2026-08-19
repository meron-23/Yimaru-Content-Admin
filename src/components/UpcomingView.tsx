import React from 'react';
import type { ContentItem } from '../types/content';
import { CONTENT_TYPE_METADATA } from '../utils/telegramTemplates';
import { CalendarClock, Eye, Calendar, XCircle, Send } from 'lucide-react';

interface UpcomingViewProps {
  items: ContentItem[];
  onPreviewItem: (item: ContentItem) => void;
  onScheduleItem: (item: ContentItem) => void;
  onCancelSchedule: (id: string) => Promise<void>;
  onPublishNow: (id: string) => Promise<void>;
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({
  items,
  onPreviewItem,
  onScheduleItem,
  onCancelSchedule,
  onPublishNow
}) => {
  const scheduledItems = items
    .filter(i => i.status === 'SCHEDULED' && i.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  const grouped: Record<string, ContentItem[]> = {};

  const todayStr = new Date().toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  scheduledItems.forEach(item => {
    const itemDate = new Date(item.scheduledAt!);
    const itemDateStr = itemDate.toDateString();

    let groupKey = 'LATER';
    if (itemDateStr === todayStr) {
      groupKey = 'TODAY';
    } else if (itemDateStr === tomorrowStr) {
      groupKey = 'TOMORROW';
    } else {
      groupKey = itemDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(item);
  });

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Publishing Timeline</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Upcoming Scheduled Content
          </h2>
          <p className="text-xs text-slate-500">
            Posts queued for future automated posting to the Yimaru channel.
          </p>
        </div>

        <div className="text-xs text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
          {scheduledItems.length} Scheduled Lessons
        </div>
      </div>

      {scheduledItems.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <CalendarClock className="w-12 h-12 mx-auto text-purple-400 opacity-40" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No upcoming posts scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Approve content in your library and set publication dates to build your upcoming schedule timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(grouped).map(groupKey => (
            <div key={groupKey} className="space-y-3">
              
              {/* Group Heading */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-lg border ${
                  groupKey === 'TODAY'
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : groupKey === 'TOMORROW'
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {groupKey}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Group Items */}
              <div className="space-y-3">
                {grouped[groupKey].map(item => {
                  const schedDate = new Date(item.scheduledAt!);
                  const timeStr = schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const typeMeta = CONTENT_TYPE_METADATA[item.contentType];

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0">
                        {/* Time Stamp Badge */}
                        <div className="w-16 h-14 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold uppercase">Time</span>
                          <span className="text-sm font-extrabold leading-none">{timeStr}</span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              style={{ backgroundColor: typeMeta?.bg, color: typeMeta?.color }}
                            >
                              {typeMeta?.label || item.contentType}
                            </span>
                            <span className="text-xs text-slate-400">
                              ID: {item.id}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                            {item.title}
                          </h3>

                          <p className="text-xs text-slate-500 truncate">
                            {item.word ? `Word: ${item.word}` : item.phrase ? `Phrase: "${item.phrase}"` : item.definition || item.description || ''}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => onPreviewItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Preview Yimaru Post"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => onScheduleItem(item)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-100 transition"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Edit Time</span>
                        </button>

                        <button
                          onClick={() => onPublishNow(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publish Now</span>
                        </button>

                        <button
                          onClick={() => onCancelSchedule(item.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Cancel Schedule (Returns to Approved status)"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
