import React, { useState } from 'react';
import type { ContentItem } from '../types/content';
import { TelegramPreviewCard } from './TelegramPreviewCard';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await onApprove(item.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide feedback explaining why changes are requested.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onReject(item.id, rejectionReason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/30">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Content Review & Approval
            </span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {item.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Telegram Preview Card */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Yimaru Audience View
              </label>
              <TelegramPreviewCard item={item} />
            </div>

            {/* Content Field Inspection */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Submission Details
              </h4>
              <div>
                <span className="text-slate-500">Content Type: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{item.contentType}</span>
              </div>
              <div>
                <span className="text-slate-500">Submitted On: </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(item.updatedAt).toLocaleString()}</span>
              </div>

              {item.word && (
                <div>
                  <span className="text-slate-500">Word: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{item.word} {item.pronunciation && `/${item.pronunciation}/`}</span>
                </div>
              )}
              {item.definition && (
                <div>
                  <span className="text-slate-500">Definition: </span>
                  <p className="mt-0.5 text-slate-800 dark:text-slate-200 font-normal">{item.definition}</p>
                </div>
              )}
              {item.exampleSentence && (
                <div>
                  <span className="text-slate-500">Example: </span>
                  <p className="mt-0.5 text-slate-800 dark:text-slate-200 italic">"{item.exampleSentence}"</p>
                </div>
              )}
            </div>

          </div>

          {/* Rejection Form Box */}
          {isRejecting && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
              <label className="block text-xs font-bold text-rose-800 dark:text-rose-200">
                Reason for Rejection / Feedback for Content Creator *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => {
                  setRejectionReason(e.target.value);
                  setError('');
                }}
                placeholder="Explain what needs to be edited before approval..."
                className="w-full px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmReject}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold"
          >
            Cancel
          </button>

          {!isRejecting && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject / Request Changes</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 active:scale-95 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Content</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
