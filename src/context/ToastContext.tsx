/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (props: { type?: ToastType; title?: string; message: string; durationMs?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({
    type = 'info',
    title,
    message,
    durationMs = 4000
  }: {
    type?: ToastType;
    title?: string;
    message: string;
    durationMs?: number;
  }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { id, type, title, message, durationMs };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts

    if (durationMs > 0) {
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Render Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0">
        {toasts.map((toast) => {
          const typeStyles = {
            success: {
              border: 'border-emerald-500/50',
              bg: 'bg-slate-900/95',
              glow: 'shadow-emerald-500/10',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
              badge: 'text-emerald-400'
            },
            error: {
              border: 'border-rose-500/50',
              bg: 'bg-slate-900/95',
              glow: 'shadow-rose-500/10',
              icon: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
              badge: 'text-rose-400'
            },
            warning: {
              border: 'border-amber-500/50',
              bg: 'bg-slate-900/95',
              glow: 'shadow-amber-500/10',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
              badge: 'text-amber-400'
            },
            info: {
              border: 'border-cyan-500/50',
              bg: 'bg-slate-900/95',
              glow: 'shadow-cyan-500/10',
              icon: <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />,
              badge: 'text-cyan-400'
            }
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border ${typeStyles.border} ${typeStyles.bg} p-4 shadow-2xl ${typeStyles.glow} backdrop-blur-md flex items-start gap-3 transition-all transform animate-fadeIn text-slate-100 font-mono`}
            >
              <div className="mt-0.5">{typeStyles.icon}</div>
              <div className="flex-1 text-xs">
                {toast.title && (
                  <div className={`font-bold ${typeStyles.badge} mb-0.5 text-sm`}>
                    {toast.title}
                  </div>
                )}
                <div className="text-slate-300 leading-relaxed break-words">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
