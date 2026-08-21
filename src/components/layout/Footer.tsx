/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, ArrowRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="site-footer" className="bg-slate-950 border-t border-slate-900 text-slate-400 font-mono text-xs mt-8 sm:mt-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-9">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 lg:gap-8">
          
          {/* 1. BRAND */}
          <div className="space-y-2 sm:space-y-3">
            <Link 
              to="/home" 
              id="footer-brand-logo"
              className="inline-flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-md shadow-cyan-500/10 group-hover:shadow-cyan-500/30 transition-all">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                  <Timer className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors">
                  <span>RUNNER</span>
                  <span className="text-cyan-400">STOPWATCH</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>mohandagar.in</span>
                </div>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-normal sm:leading-relaxed max-w-xs">
              Multi-Checkpoint Authoritative Cloud Timing System
            </p>

            <div className="text-[11px] text-slate-500">
              © 2026 Runner Stopwatch. All rights reserved.
            </div>
          </div>

          {/* 2. QUICK LINKS */}
          <div className="space-y-2 sm:space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/80 pb-1.5 sm:pb-2">
              Quick Links
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs">
              <li>
                <Link 
                  to="/home" 
                  id="footer-link-home"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/results" 
                  id="footer-link-results"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Race Results</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/join" 
                  id="footer-link-join-checkpoint"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Join Checkpoint</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/host/dashboard" 
                  id="footer-link-host-dashboard"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/host/races" 
                  id="footer-link-race-history"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Race History</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. RACE TIMING */}
          <div className="space-y-2 sm:space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/80 pb-1.5 sm:pb-2">
              Race Timing
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs">
              <li>
                <Link 
                  to="/host/race/new" 
                  id="footer-link-create-race"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Create Race</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. INFORMATION */}
          <div className="space-y-2 sm:space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/80 pb-1.5 sm:pb-2">
              Information
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs">
              <li>
                <Link 
                  to="/how-it-works" 
                  id="footer-link-how-it-works"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 text-slate-400 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>How It Works</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy-policy"
                  id="footer-link-privacy-policy"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 text-slate-400 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service"
                  id="footer-link-terms-of-service"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 text-slate-400 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@mohandagar.in"
                  id="footer-link-contact-us"
                  className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 text-slate-400 py-0.5 sm:py-0"
                >
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Footer Bar */}
        <div className="mt-5 sm:mt-7 pt-4 sm:pt-5 border-t border-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2.5 text-slate-500 text-[11px] text-center sm:text-left">
          <div id="footer-copyright-bottom">
            © 2026 Runner Stopwatch
          </div>
          <div id="footer-tagline-bottom" className="text-center sm:text-right">
            Built for real-time multi-device race timing
          </div>
        </div>
      </div>
    </footer>
  );
};
