/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs font-mono text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Multi-Checkpoint Authoritative Cloud Timing System</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/host"
            className="hover:text-cyan-400 transition-colors"
          >
            Host Controller
          </Link>
          <span>•</span>
          <Link 
            to="/join"
            className="hover:text-cyan-400 transition-colors"
          >
            Staff Checkpoint Join
          </Link>
          <span>•</span>
          <span className="text-slate-400">mohandagar.in</span>
        </div>
      </div>
    </footer>
  );
};
