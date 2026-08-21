/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RaceService } from '../services/raceService';
import { Race } from '../types/race';
import { formatDistance } from '../utils/raceCalculations';
import { 
  Plus, 
  Timer, 
  History, 
  Play, 
  Trophy, 
  ArrowRight, 
  Layers, 
  User, 
  QrCode
} from 'lucide-react';

export const HostDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [hostRaces, setHostRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to host races
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = RaceService.subscribeToHostRaces(
      currentUser.uid,
      (races) => {
        setHostRaces(races);
        setLoading(false);
      },
      (err) => {
        console.warn('Host races query warning:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser?.uid]);

  const activeRunningRaces = hostRaces.filter(r => r.status === 'RUNNING' || r.status === 'READY');
  const finishedRaces = hostRaces.filter(r => r.status === 'FINISHED');

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Top Welcome Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
            <Timer className="w-4 h-4" />
            <span>Host Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Race Controller Dashboard
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{currentUser?.displayName || currentUser?.email}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/host/races"
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>All Races ({hostRaces.length})</span>
          </Link>

          <Link
            to="/host/race/new"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW RACE</span>
          </Link>
        </div>
      </div>

      {/* Active Races Section */}
      {activeRunningRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active & Ready Races ({activeRunningRaces.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRunningRaces.map((race) => (
              <div
                key={race.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      race.status === 'RUNNING'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {race.status}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 font-semibold">
                      {formatDistance(race.totalPlannedDistanceMeters, race.displayUnit)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mb-1 truncate">
                    {race.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-400 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Runner: <strong className="text-slate-200">{race.runnerName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Checkpoints: <strong className="text-slate-200">{race.checkpoints?.length || 0} gates</strong></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <Link
                    to={`/host/race/${race.id}`}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all text-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Open Timer</span>
                  </Link>
                  <Link
                    to={`/host/race/${race.id}/checkpoints`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-mono text-xs flex items-center justify-center gap-1 transition-colors text-center"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gates & QR</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Completed Races */}
      {finishedRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Recently Completed Races</span>
            </h2>
            <Link to="/host/races" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finishedRaces.slice(0, 3).map((race) => (
              <div
                key={race.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      FINISHED
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {formatDistance(race.totalPlannedDistanceMeters, race.displayUnit)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100 mb-1 truncate">
                    {race.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">
                    Runner: <strong className="text-slate-200">{race.runnerName}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                  <Link
                    to={`/host/race/${race.id}/results`}
                    className="py-2.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>View Results</span>
                  </Link>
                  <Link
                    to={`/activity/${race.id}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs flex items-center justify-center gap-1 transition-all text-center"
                  >
                    <span>Public Card</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State when no races yet */}
      {!loading && hostRaces.length === 0 && (
        <div className="text-center py-16 px-4 bg-slate-900/50 border border-slate-800/80 rounded-3xl max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Timer className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">No Races Created Yet</h2>
          <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto leading-relaxed">
            Create your first race session, specify distance and checkpoints, and distribute QR codes to volunteer timing staff.
          </p>
          <Link
            to="/host/race/new"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono text-sm inline-flex items-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>CREATE YOUR FIRST RACE</span>
          </Link>
        </div>
      )}

    </div>
  );
};
