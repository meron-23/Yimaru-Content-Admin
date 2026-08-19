import React, { useState } from 'react';
import type { ContentItem } from '../types/content';
import { renderTelegramPost } from '../utils/telegramTemplates';
import { Send, Eye, CheckCheck, Moon, Sun, ExternalLink, Copy, Check } from 'lucide-react';

interface TelegramPreviewCardProps {
  item: Partial<ContentItem>;
  channelName?: string;
  channelSubscriberCount?: string;
  compact?: boolean;
}

export const TelegramPreviewCard: React.FC<TelegramPreviewCardProps> = ({
  item,
  channelName = 'English Learning Hub',
  channelSubscriberCount = '3.2k',
  compact = false
}) => {
  const [darkTg, setDarkTg] = useState(false);
  const [copied, setCopied] = useState(false);
  const post = renderTelegramPost(item);

  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopyText = () => {
    navigator.clipboard.writeText(post.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
      
      {/* Telegram Card Header Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Yimaru Channel Post Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition"
            title="Copy post markdown text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDarkTg(!darkTg)}
            className="p-1 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition"
            title={darkTg ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkTg ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Telegram App Interface Canvas */}
      <div className={`telegram-preview-container p-4 sm:p-6 transition-colors duration-200 ${darkTg ? 'dark-tg' : ''}`}>
        
        <div className="max-w-md mx-auto">

          {/* Channel Header Bar inside Telegram */}
          <div className={`flex items-center gap-3 p-3 rounded-t-xl border-b ${
            darkTg ? 'bg-[#17212b] border-[#0e1621] text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold text-sm shadow">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-sm truncate leading-tight">{channelName}</h4>
                <span className="w-3.5 h-3.5 rounded-full bg-[var(--brand-primary)] text-white text-[9px] flex items-center justify-center font-bold">✓</span>
              </div>
              <p className={`text-xs ${darkTg ? 'text-slate-400' : 'text-slate-500'}`}>
                {channelSubscriberCount} subscribers
              </p>
            </div>
          </div>

          {/* Telegram Post Bubble */}
          <div className={`telegram-bubble p-4 rounded-b-xl ${compact ? 'text-xs' : 'text-sm'}`}>
            
            {/* Optional Photo Attachment */}
            {post.imageUrl && (
              <div className="mb-3 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 max-h-64 flex items-center justify-center">
                <img 
                  src={post.imageUrl} 
                  alt={item.title || 'Educational Content'} 
                  className="w-full h-full object-cover max-h-64"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Message Body Text */}
            <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800 dark:text-slate-100">
              {post.text}
            </div>

            {/* Simulated Inline Action Buttons */}
            {post.buttons.length > 0 && (
              <div className="mt-3.5 flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                {post.buttons.map((btn, idx) => (
                  <a
                    key={idx}
                    href={btn.url}
                    target="_blank"
                    rel="noreferrer"
                    className="telegram-btn w-full py-2 px-3 text-center text-xs flex items-center justify-center gap-1.5 font-medium transition"
                  >
                    <span>{btn.text}</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ))}
              </div>
            )}

            {/* Telegram Timestamp & View Count Footer */}
            <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[11px] text-slate-400 dark:text-slate-400">
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3 opacity-70" />
                <span>1.4k</span>
              </span>
              <span>•</span>
              <span>{formattedTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
