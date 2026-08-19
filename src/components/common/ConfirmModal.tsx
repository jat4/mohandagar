/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const styleConfig = {
    danger: {
      icon: <AlertCircle className="w-7 h-7 text-rose-400" />,
      bgIcon: 'bg-rose-950/80 border-rose-500/40 text-rose-400',
      btn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30',
      border: 'border-rose-500/30'
    },
    warning: {
      icon: <AlertTriangle className="w-7 h-7 text-amber-400" />,
      bgIcon: 'bg-amber-950/80 border-amber-500/40 text-amber-400',
      btn: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/30 font-bold',
      border: 'border-amber-500/30'
    },
    info: {
      icon: <Info className="w-7 h-7 text-cyan-400" />,
      bgIcon: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400',
      btn: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 font-bold',
      border: 'border-cyan-500/30'
    },
    success: {
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
      bgIcon: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400',
      btn: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/30 font-bold',
      border: 'border-emerald-500/30'
    }
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-md bg-slate-900 border ${styleConfig.border} rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 font-mono`}>
        
        {/* Close Button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-2xl border ${styleConfig.bgIcon} flex-shrink-0`}>
            {styleConfig.icon}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-100 tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 ${styleConfig.btn}`}
          >
            {isLoading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
