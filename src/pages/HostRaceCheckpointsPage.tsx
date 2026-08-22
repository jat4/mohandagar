/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { TimeSyncService } from '../services/timeSyncService';
import { Race, Checkpoint, StaffSession, normalizeCheckpointType, getActiveCheckpointAssignment, hasValidActiveAssignment, formatCleanErrorMessage } from '../types/race';
import { formatDistance } from '../utils/raceCalculations';
import { QrCodeModal } from '../components/race/QrCodeModal';
import { 
  Layers, 
  ArrowLeft, 
  QrCode, 
  Smartphone, 
  User, 
  Timer, 
  Play, 
  Copy, 
  Check, 
  Activity, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const HostRaceCheckpointsPage: React.FC = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [race, setRace] = useState<Race | null>(null);
  const [staffSessions, setStaffSessions] = useState<StaffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQrCp, setSelectedQrCp] = useState<Checkpoint | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId) {
      setError('No race ID specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    RaceService.getRace(raceId).then((r) => {
      if (!r) setError('Race not found.');
      else setRace(r);
    }).catch((err) => {
      setError(err.message || 'Error loading race checkpoints.');
    }).finally(() => {
      setLoading(false);
    });

    const unsubRace = RaceService.subscribeToRace(raceId, (r) => {
      if (r) setRace(r);
    });

    const unsubSessions = RaceService.subscribeToStaffSessions(raceId, (sessions) => {
      setStaffSessions(sessions);
    });

    return () => {
      unsubRace();
      unsubSessions();
    };
  }, [raceId]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm">Loading Checkpoints from Firebase...</span>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-mono">
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error || 'Race not found'}</span>
        </div>
        <Link
          to="/host/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <Link
            to={`/host/race/${race.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live Timer</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                {race.name} Checkpoints
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Runner: <strong className="text-slate-200">{race.runnerName}</strong> • {race.checkpoints.length} Gates Total
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/host/race/${race.id}`}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
          >
            <Timer className="w-4 h-4 fill-slate-950" />
            <span>Open Controller</span>
          </Link>
        </div>
      </div>

      {/* Checkpoints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {race.checkpoints.map((cp, idx) => {
          const normType = normalizeCheckpointType(cp.type);
          const isStartOnly = normType === 'start' || cp.isStart;
          const isFinishOnly = !isStartOnly && normType === 'finish';
          const isSplitFinish = !isStartOnly && normType === 'splitFinish';

          const activeAssignment = getActiveCheckpointAssignment(cp, staffSessions);
          const isHost = activeAssignment.isHost;

          let session = staffSessions.find(s => s.checkpointId === cp.id);
          if (!session && isStartOnly) {
            session = staffSessions.find(s => s.checkpointId === 'START' || s.checkpointName?.toUpperCase().includes('START'));
          }

          const isOnline = Boolean(
            session &&
            session.status !== 'OFFLINE' &&
            (
              Math.abs(Date.now() - (session.lastSeenAt || 0)) < 45000 ||
              Math.abs(TimeSyncService.now() - (session.lastSeenAt || 0)) < 45000
            )
          );

          return (
            <div
              key={cp.id}
              className={`p-5 rounded-2xl bg-slate-900 border shadow-xl transition-all space-y-4 ${
                isHost ? 'border-cyan-500/50 bg-slate-900/90' : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-slate-300">
                      {isStartOnly ? 'Start Gate' : isFinishOnly ? 'Finish Gate' : `Gate #${idx + 1}`}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 font-bold">
                      {isStartOnly ? '0 m (Fixed)' : formatDistance(cp.distanceMeters, race.displayUnit)}
                    </span>
                    {isStartOnly ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                        🚦 Start Line (Start Only) 🔒
                      </span>
                    ) : isFinishOnly ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/30 font-bold">
                        🏁 Finish Line (Finish Only) 🔒
                      </span>
                    ) : isSplitFinish ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        ⚡ Split Gate (Split & Finish)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        ⚡ Split (Split Only)
                      </span>
                    )}
                    {isHost && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                        👑 Host Assigned
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {cp.name}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedQrCp(cp)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                  title="View & Print QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              {/* Join Code Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Join Code</div>
                  <div className="text-xl font-mono font-black text-cyan-300 tracking-wider">
                    {cp.joinCode}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(cp.joinCode)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode === cp.joinCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Device / Staff Status */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Staff:{' '}
                    {activeAssignment.isOccupied ? (
                      <strong className="text-slate-200">
                        {isHost ? `👑 Host (${activeAssignment.staffName})` : activeAssignment.staffName}
                      </strong>
                    ) : (
                      <strong className="text-slate-500">— (Unassigned)</strong>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    !activeAssignment.isOccupied ? 'bg-slate-700' : (isHost ? 'bg-cyan-400 animate-pulse' : isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500')
                  }`} />
                  <span className={
                    !activeAssignment.isOccupied 
                      ? 'text-slate-500' 
                      : (isHost ? 'text-cyan-300 font-bold' : isOnline ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold')
                  }>
                    {!activeAssignment.isOccupied ? 'No Device' : (isHost ? 'Host Gate' : isOnline ? 'ONLINE / CONNECTED' : 'OFFLINE')}
                  </span>
                </div>
              </div>

              {/* Time Checkpoint as Host action */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <Link
                  to={`/checkpoint/${cp.id}?raceId=${race.id}`}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors text-center"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{isHost ? 'Open Gate Screen (Host)' : 'Open Gate Screen as Staff / Host'}</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {selectedQrCp && (
        <QrCodeModal
          isOpen={Boolean(selectedQrCp)}
          onClose={() => setSelectedQrCp(null)}
          race={race}
          checkpoint={selectedQrCp}
        />
      )}

    </div>
  );
};
