/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Zap } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
  createdAt: number;
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
    const newToast: ToastItem = { id, type, title, message, durationMs, createdAt: Date.now() };

    setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 toasts

    if (durationMs > 0) {
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Render Container: Optimized for mobile top-center and desktop bottom-right */}
      <div className="fixed top-4 left-3 right-3 sm:top-auto sm:bottom-5 sm:left-auto sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-auto sm:w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: {
              border: 'border-emerald-500/40',
              bg: 'bg-slate-900/98',
              badgeBg: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30',
              glow: 'shadow-emerald-500/15',
              barBg: 'bg-emerald-400',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
              badge: 'text-emerald-400'
            },
            error: {
              border: 'border-rose-500/40',
              bg: 'bg-slate-900/98',
              badgeBg: 'bg-rose-950/80 text-rose-400 border border-rose-500/30',
              glow: 'shadow-rose-500/15',
              barBg: 'bg-rose-400',
              icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
              badge: 'text-rose-400'
            },
            warning: {
              border: 'border-amber-500/40',
              bg: 'bg-slate-900/98',
              badgeBg: 'bg-amber-950/80 text-amber-400 border border-amber-500/30',
              glow: 'shadow-amber-500/15',
              barBg: 'bg-amber-400',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
              badge: 'text-amber-400'
            },
            info: {
              border: 'border-cyan-500/40',
              bg: 'bg-slate-900/98',
              badgeBg: 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/30',
              glow: 'shadow-cyan-500/15',
              barBg: 'bg-cyan-400',
              icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
              badge: 'text-cyan-400'
            }
          }[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${typeStyles.border} ${typeStyles.bg} p-3.5 sm:p-4 shadow-2xl ${typeStyles.glow} backdrop-blur-xl flex items-start gap-3 transition-all duration-300 transform animate-fadeIn text-slate-100 font-mono`}
            >
              <div className="mt-0.5">{typeStyles.icon}</div>
              <div className="flex-1 text-xs min-w-0">
                {toast.title && (
                  <div className={`font-bold ${typeStyles.badge} text-xs sm:text-sm mb-0.5 tracking-tight flex items-center gap-1.5`}>
                    <span>{toast.title}</span>
                  </div>
                )}
                <div className="text-slate-300 text-[11px] sm:text-xs leading-relaxed break-words font-sans">
                  {toast.message}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
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
