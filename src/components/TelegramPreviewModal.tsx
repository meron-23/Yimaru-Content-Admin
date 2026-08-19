import React from 'react';
import type { ContentItem } from '../types/content';
import { TelegramPreviewCard } from './TelegramPreviewCard';
import { STATUS_METADATA } from '../utils/workflow';
import { X, Calendar, UserCheck } from 'lucide-react';

interface TelegramPreviewModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (item: ContentItem) => void;
  onSchedule?: (item: ContentItem) => void;
}

export const TelegramPreviewModal: React.FC<TelegramPreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  onApprove,
  onSchedule
}) => {
  if (!isOpen || !item) return null;

  const statusMeta = STATUS_METADATA[item.status];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              {item.title}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}>
              {statusMeta.label}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Preview */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {item.rejectionReason && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
              <span className="font-bold">Rejection Note: </span>
              {item.rejectionReason}
            </div>
          )}

          {item.approvedBy && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Approved by <strong>{item.approvedBy}</strong></span>
            </div>
          )}

          {item.scheduledAt && (
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
              <Calendar className="w-4 h-4" />
              <span>Scheduled for {new Date(item.scheduledAt).toLocaleString()}</span>
            </div>
          )}

          <TelegramPreviewCard item={item} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Updated {new Date(item.updatedAt).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            {item.status === 'PENDING_APPROVAL' && onApprove && (
              <button
                onClick={() => {
                  onClose();
                  onApprove(item);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition"
              >
                Review & Approve
              </button>
            )}

            {item.status === 'APPROVED' && onSchedule && (
              <button
                onClick={() => {
                  onClose();
                  onSchedule(item);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow transition"
              >
                Schedule Publication
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
