/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-6 text-center font-mono animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <Timer className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-black text-cyan-400">404</div>
          <h1 className="text-2xl font-bold text-slate-100">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-400">
            The requested page does not exist.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/home"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
