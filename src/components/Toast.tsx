import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-200 dark:border-rose-900 bg-rose-50/90 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100',
    info: 'border-sky-200 dark:border-sky-900 bg-sky-50/90 dark:bg-sky-950/90 text-sky-900 dark:text-sky-100'
  };

  return (
    <div className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${borders[toast.type]}`}>
      <div className="flex items-center gap-3">
        {icons[toast.type]}
        <p className="text-sm font-medium leading-tight">{toast.message}</p>
      </div>
      <button 
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-700 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
