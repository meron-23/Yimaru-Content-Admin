import React, { useState, useEffect } from 'react';
import type { ContentItem } from '../types/content';
import { X, Calendar, AlertCircle, Check } from 'lucide-react';

interface ScheduleModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSchedule: (id: string, scheduledAtIso: string) => Promise<void>;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmSchedule
}) => {
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item?.scheduledAt) {
      const date = new Date(item.scheduledAt);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localIso = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      setScheduledDateTime(localIso);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
      const localIso = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
      setScheduledDateTime(localIso);
    }
    setError('');
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleApplyPreset = (hoursFromNow: number, targetHour: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (hoursFromNow / 24));
    targetDate.setHours(targetHour, 0, 0, 0);
    const tzOffset = targetDate.getTimezoneOffset() * 60000;
    const localIso = new Date(targetDate.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledDateTime(localIso);
    setError('');
  };

  const handleSaveSchedule = async () => {
    if (!scheduledDateTime) {
      setError('Please select a date and time.');
      return;
    }

    const selectedDate = new Date(scheduledDateTime);
    if (isNaN(selectedDate.getTime())) {
      setError('Invalid date/time format.');
      return;
    }

    if (selectedDate <= new Date()) {
      setError('Publication date must be in the future.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmSchedule(item.id, selectedDate.toISOString());
      onClose();
    } catch (err) {
      console.error('Error scheduling:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/30">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Schedule Publication
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {item.title}
            </h4>
            <p className="text-xs text-slate-500">
              Select the future date and time for Yimaru publication.
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick Shortcuts
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(24, 8)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium text-left transition"
              >
                🌅 Tomorrow 08:00
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(24, 13)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium text-left transition"
              >
                ☀️ Tomorrow 13:00
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(24, 19)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium text-left transition"
              >
                🌙 Tomorrow 19:00
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(48, 8)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium text-left transition"
              >
                📅 In 2 Days 08:00
              </button>
            </div>
          </div>

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Custom Date & Time
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={e => {
                  setScheduledDateTime(e.target.value);
                  setError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveSchedule}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-md shadow-purple-500/20 active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Schedule</span>
          </button>
        </div>

      </div>
    </div>
  );
};
