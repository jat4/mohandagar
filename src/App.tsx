/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HostDashboard } from './components/race/HostDashboard';
import { CheckpointJoinScreen } from './components/race/CheckpointJoinScreen';
import { testConnection } from './lib/firebase';
import { 
  AppRoute, 
  parseCurrentRoute, 
  routeToHash, 
  BreadcrumbItem 
} from './utils/router';
import { 
  Timer, 
  QrCode, 
  Zap, 
  Copy, 
  Check, 
  ChevronRight, 
  Home, 
  Activity, 
  ArrowLeft,
  Share2
} from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parseCurrentRoute());
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Synchronize with browser hash & history
  useEffect(() => {
    testConnection().catch((err) => console.warn('Firebase connection check:', err));

    const handleLocationChange = () => {
      const parsed = parseCurrentRoute();
      setCurrentRoute(parsed);
    };

    // Initial check if opened without hash
    if (!window.location.hash) {
      window.location.hash = routeToHash(currentRoute);
    }

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = useCallback((newRoute: AppRoute, replace = false) => {
    const targetHash = routeToHash(newRoute);
    if (replace) {
      window.history.replaceState(null, '', targetHash);
    } else {
      window.location.hash = targetHash;
    }
    setCurrentRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopyCurrentLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }).catch(console.error);
  };

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [
      { label: 'Stopwatch Home', route: { name: 'host-home' } }
    ];

    if (currentRoute.name === 'host-home') {
      crumbs.push({ label: 'Host Dashboard', active: true });
    } else if (currentRoute.name === 'host-live') {
      crumbs.push({ label: 'Host Controller', route: { name: 'host-home' } });
      crumbs.push({ label: 'Live Race Timer', active: true });
    } else if (currentRoute.name === 'host-summary') {
      crumbs.push({ label: 'Host Controller', route: { name: 'host-home' } });
      crumbs.push({ label: 'Activity Analytics & Export', active: true });
    } else if (currentRoute.name === 'join') {
      crumbs.push({ 
        label: currentRoute.joinCode ? `Join Code: ${currentRoute.joinCode}` : 'Staff Checkpoint Join', 
        active: true 
      });
    } else if (currentRoute.name === 'staff') {
      crumbs.push({ label: 'Staff Join', route: { name: 'join' } });
      crumbs.push({ label: `Active Checkpoint Timing`, active: true });
    }

    return crumbs;
  };

  const isHostView = currentRoute.name === 'host-home' || currentRoute.name === 'host-live' || currentRoute.name === 'host-summary';
  const isJoinView = currentRoute.name === 'join' || currentRoute.name === 'staff';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased flex flex-col justify-between">
      
      {/* Top Application Navigation Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Direct Home Link */}
          <div 
            onClick={() => navigate({ name: 'host-home' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Timer className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-mono font-black text-base tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors">
                <span>RUNNER</span>
                <span className="text-cyan-400">STOPWATCH</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Multi-Checkpoint Sync</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">mohandagar.in</span>
              </div>
            </div>
          </div>

          {/* Quick Route Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Direct Link Share Button */}
            <button
              onClick={handleCopyCurrentLink}
              title="Copy link to current page/checkpoint"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline text-emerald-400 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden md:inline">Share Page</span>
                </>
              )}
            </button>

            {/* Primary View Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                id="host-nav-tab"
                onClick={() => navigate({ name: 'host-home' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isHostView
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Host Controller</span>
                <span className="sm:hidden">Host</span>
              </button>

              <button
                id="join-nav-tab"
                onClick={() => navigate({ name: 'join' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isJoinView
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Staff Join</span>
                <span className="sm:hidden">Staff</span>
              </button>
            </div>

          </div>

        </div>

        {/* Dynamic Breadcrumbs Sub-Bar */}
        <div className="bg-slate-950/80 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
            
            <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  {crumb.active || !crumb.route ? (
                    <span className="text-cyan-400 font-bold truncate max-w-[200px] sm:max-w-none">
                      {crumb.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => crumb.route && navigate(crumb.route)}
                      className="hover:text-slate-200 transition-colors cursor-pointer truncate"
                    >
                      {crumb.label}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
              <span>Route:</span>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300/80 border border-slate-800">
                {routeToHash(currentRoute)}
              </code>
            </div>

          </div>
        </div>
      </header>

      {/* Main Routed Content View */}
      <main className="flex-1">
        {isHostView && (
          <HostDashboard 
            onJoinByCodeClicked={() => navigate({ name: 'join' })}
            routeRaceId={
              currentRoute.name === 'host-live' || currentRoute.name === 'host-summary'
                ? currentRoute.raceId
                : undefined
            }
            routeView={
              currentRoute.name === 'host-summary'
                ? 'summary'
                : currentRoute.name === 'host-live'
                ? 'live'
                : 'home'
            }
            onNavigateRoute={(view, raceId) => {
              if (view === 'live' && raceId) {
                navigate({ name: 'host-live', raceId });
              } else if (view === 'summary' && raceId) {
                navigate({ name: 'host-summary', raceId });
              } else {
                navigate({ name: 'host-home' });
              }
            }}
          />
        )}

        {isJoinView && (
          <CheckpointJoinScreen 
            initialJoinCode={currentRoute.name === 'join' ? currentRoute.joinCode : undefined}
            initialStaffParams={
              currentRoute.name === 'staff'
                ? {
                    raceId: currentRoute.raceId,
                    checkpointId: currentRoute.checkpointId,
                    joinCode: currentRoute.joinCode,
                    staffName: currentRoute.staffName
                  }
                : undefined
            }
            onBackToMain={() => navigate({ name: 'host-home' })}
            onJoinedStaff={(info) => {
              navigate({
                name: 'staff',
                raceId: info.raceId,
                checkpointId: info.checkpointId,
                joinCode: info.joinCode,
                staffName: info.staffName
              });
            }}
          />
        )}
      </main>

      {/* Modern Timing Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Multi-Checkpoint Authoritative Cloud Timing System</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate({ name: 'host-home' })}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Host Controller
            </button>
            <span>•</span>
            <button 
              onClick={() => navigate({ name: 'join' })}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Staff Checkpoint Join
            </button>
            <span>•</span>
            <span className="text-slate-400">mohandagar.in</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
