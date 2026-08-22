import React, { useState } from 'react';
import { 
  Race, 
  TimingEvent, 
  StaffSession, 
  Checkpoint,
  normalizeCheckpointType,
  getActiveCheckpointAssignment,
  hasValidActiveAssignment
} from '../../types/race';
import { RaceService } from '../../services/raceService';
import { useTimeSync, TimeSyncService } from '../../services/timeSyncService';
import { 
  calculateRaceStatistics, 
  formatDistance, 
  formatTimeMs 
} from '../../utils/raceCalculations';
import { RaceTimerClock } from './RaceTimerClock';
import { LiveRaceProgressTimeline } from './LiveRaceProgressTimeline';
import { QrCodeModal } from './QrCodeModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { 
  Play, 
  Flag, 
  QrCode, 
  RotateCcw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Share2, 
  Smartphone, 
  UserCheck, 
  Trophy,
  ArrowRight,
  TrendingUp,
  Activity,
  RefreshCw
} from 'lucide-react';

interface RaceLiveDashboardProps {
  race: Race;
  events: TimingEvent[];
  staffSessions: StaffSession[];
  onOpenSummary?: () => void;
  onViewSummary?: () => void;
  onAssignSelfToCheckpoint?: (checkpoint: Checkpoint) => void;
  onTimeCheckpointAsHost?: (checkpoint: Checkpoint) => void;
  onOpenQrCode?: (checkpoint: Checkpoint) => void;
  onStartRace?: () => void;
  onFinishRace?: () => void;
  onResetRace?: () => void;
}

export const RaceLiveDashboard: React.FC<RaceLiveDashboardProps> = ({
  race,
  events,
  staffSessions,
  onOpenSummary,
  onViewSummary,
  onAssignSelfToCheckpoint,
  onTimeCheckpointAsHost,
  onOpenQrCode,
  onStartRace,
  onFinishRace,
  onResetRace
}) => {
  const [selectedQrCheckpoint, setSelectedQrCheckpoint] = useState<Checkpoint | null>(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [pendingHostFinish, setPendingHostFinish] = useState<{ timestamp: number; elapsedMs: number } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const timeSync = useTimeSync();
  const [recalibrating, setRecalibrating] = useState(false);

  const stats = calculateRaceStatistics(race, events);
  const isRunning = race.status === 'RUNNING';
  const isReady = race.status === 'READY';
  const isFinished = race.status === 'FINISHED';

  // Map staff sessions by checkpointId
  // Pick the most recent session for each checkpointId
  const now = TimeSyncService.now() || Date.now();
  const sessionByCheckpoint = new Map<string, StaffSession>();
  staffSessions.forEach((s) => {
    const existing = sessionByCheckpoint.get(s.checkpointId);
    if (!existing || (s.lastSeenAt || 0) > (existing.lastSeenAt || 0)) {
      sessionByCheckpoint.set(s.checkpointId, s);
    }
  });

  const handleStartRace = async () => {
    setStarting(true);
    try {
      await RaceService.startRace(race.id);
    } catch (err) {
      console.error('Error starting race:', err);
    } finally {
      setStarting(false);
    }
  };

  // Immediate Authoritative Capture before opening confirm dialog
  const handleTriggerHostFinishCapture = () => {
    if (!race.startTimestamp || race.status !== 'RUNNING') return;
    const finishPressedAt = TimeSyncService.now();
    const elapsedMs = Math.max(0, finishPressedAt - race.startTimestamp);
    setPendingHostFinish({ timestamp: finishPressedAt, elapsedMs });
    setShowFinishConfirm(true);
  };

  const handleConfirmFinishRace = async () => {
    if (!pendingHostFinish) return;
    setFinishing(true);
    try {
      await RaceService.finishRace(race.id, pendingHostFinish.timestamp);
      setShowFinishConfirm(false);
      setPendingHostFinish(null);
    } catch (err) {
      console.error('Error finishing race:', err);
    } finally {
      setFinishing(false);
    }
  };

  const handleCancelFinishRace = () => {
    setShowFinishConfirm(false);
    setPendingHostFinish(null);
  };

  const progressPercent = Math.min(
    100,
    race.totalPlannedDistanceMeters > 0
      ? (stats.actualDistanceMeters / race.totalPlannedDistanceMeters) * 100
      : 0
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Top Banner & Control Center */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Authoritative Live Race Controller</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              {race.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-slate-400 mt-2">
              <span>Runner: <strong className="text-slate-100 font-bold">{race.runnerName}</strong></span>
              <span>•</span>
              <span>Planned: <strong className="text-cyan-300">{formatDistance(race.totalPlannedDistanceMeters, race.displayUnit)}</strong></span>
              <span>•</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isRunning
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : isFinished
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/30'
              }`}>
                STATUS: {race.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {isReady && (
              <button
                onClick={handleStartRace}
                disabled={starting}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{starting ? 'STARTING...' : 'START RACE'}</span>
              </button>
            )}

            {isRunning && (
              <button
                onClick={handleTriggerHostFinishCapture}
                disabled={finishing}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer min-h-[48px]"
              >
                <Flag className="w-4 h-4" />
                <span>FINISH RACE</span>
              </button>
            )}

            {isFinished && (
              <button
                id="btn-view-result-host"
                onClick={onOpenSummary}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer min-h-[48px]"
              >
                <Trophy className="w-4 h-4" />
                <span>View Result</span>
              </button>
            )}

            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center"
              title="Reset Race"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Live Stopwatch */}
        <div className="my-6 sm:my-8 text-center px-1">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest">
              Authoritative Cloud Synced Clock
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] sm:text-[11px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${
                timeSync.isSynced ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className="text-slate-300">
                Sync: {timeSync.offsetMs >= 0 ? `+${timeSync.offsetMs}ms` : `${timeSync.offsetMs}ms`}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{timeSync.rttMs}ms RTT</span>
              <button
                onClick={async () => {
                  setRecalibrating(true);
                  await timeSync.recalibrate();
                  setRecalibrating(false);
                }}
                disabled={recalibrating}
                title="Recalibrate clock offset with cloud time"
                className="ml-1 text-cyan-400 hover:text-cyan-300 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${recalibrating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <RaceTimerClock
            startTimestamp={race.startTimestamp}
            finishTimestamp={race.finishTimestamp}
            isRunning={isRunning}
            size="hero"
            className="text-cyan-300 font-mono py-2"
          />

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mt-4 sm:mt-6">
            <div className="flex justify-between text-[11px] sm:text-xs font-mono text-slate-400 mb-1.5">
              <span>{stats.actualDistanceKm.toFixed(2)} km</span>
              <span className="font-bold text-cyan-300">{progressPercent.toFixed(0)}%</span>
              <span>{(race.totalPlannedDistanceMeters / 1000).toFixed(2)} km</span>
            </div>
            <div className="h-2.5 sm:h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-5 sm:pt-6 border-t border-slate-800">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Current Distance</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-cyan-300">
              {stats.actualDistanceKm.toFixed(2)} km
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Pace</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-amber-300">
              {stats.averagePaceFormatted}
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Speed</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-emerald-300">
              {stats.averageSpeedFormatted}
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Splits Recorded</div>
            <div className="text-lg sm:text-xl font-mono font-bold text-slate-200">
              {stats.recordedCheckpointsCount} / {stats.totalCheckpointsCount}
            </div>
          </div>
        </div>

      </div>

      {/* Real-Time Live Checkpoint Progress & Arrival Prediction */}
      <LiveRaceProgressTimeline
        race={race}
        events={events}
        isHostView={true}
      />

      {/* Checkpoint Live Table & Staff Devices */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Checkpoints & Assigned Devices</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5">
              Live status of checkpoint timing devices, join codes, and recorded split segments
            </p>
          </div>

          <div className="text-[11px] sm:text-xs font-mono text-slate-400">
            Click <strong className="text-cyan-300">"Time as Host"</strong> to record splits on this device.
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Checkpoint</th>
                <th className="py-3.5 px-4">Distance</th>
                <th className="py-3.5 px-4">Assigned Device / Staff</th>
                <th className="py-3.5 px-4">Connection</th>
                <th className="py-3.5 px-4">Event Status</th>
                <th className="py-3.5 px-4">Split Time</th>
                <th className="py-3.5 px-4">Measured Segment</th>
                <th className="py-3.5 px-4">Segment Pace</th>
                <th className="py-3.5 px-4">Speed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {stats.processedCheckpoints.map((row) => {
                const normType = normalizeCheckpointType(row.checkpoint.type);
                const isStartOnly = normType === 'start' || row.checkpoint.isStart;
                const isFinishOnly = !isStartOnly && normType === 'finish';
                const isSplitFinish = !isStartOnly && normType === 'splitFinish';

                const activeAssignment = getActiveCheckpointAssignment(row.checkpoint, staffSessions);
                const isHost = activeAssignment.isHost;

                let session = sessionByCheckpoint.get(row.checkpoint.id);
                if (!session && isStartOnly) {
                  session = staffSessions.find(s => s.checkpointId === 'START' || s.checkpointName?.toUpperCase().includes('START'));
                }

                const isOnline = Boolean(session && (
                  Math.abs(now - (session.lastSeenAt || 0)) < 60000 || 
                  Math.abs(Date.now() - (session.lastSeenAt || 0)) < 60000
                ));

                return (
                  <tr 
                    key={row.checkpoint.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      row.status === 'MISSED' ? 'bg-amber-950/15' : ''
                    } ${isHost ? 'bg-cyan-950/20' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span>{row.checkpoint.name}</span>
                        {isHost && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                            👑 Host
                          </span>
                        )}
                      </div>
                      {isStartOnly ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                          🚦 Start Line (Start Only) 🔒
                        </span>
                      ) : isFinishOnly ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/30 font-semibold uppercase">
                          🏁 Finish Line (Finish Only) 🔒
                        </span>
                      ) : isSplitFinish ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                          ⚡ Split Gate (Split & Finish)
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-semibold uppercase">
                          ⚡ Split (Split Only)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-semibold">
                      {isStartOnly ? '0 m' : formatDistance(row.checkpoint.distanceMeters, race.displayUnit)}
                    </td>

                    <td className="py-3.5 px-4">
                      {activeAssignment.isOccupied ? (
                        isHost ? (
                          <div>
                            <div className="font-bold text-amber-300 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>{activeAssignment.staffName}</span>
                            </div>
                            <div className="text-[10px] text-amber-400/80 font-mono">Host Timing Gate</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-200">{activeAssignment.staffName}</div>
                            <div className="text-[10px] text-slate-400">{activeAssignment.deviceName || session?.deviceName || 'Staff Device'}</div>
                          </div>
                        )
                      ) : (
                        <span className="text-slate-600 text-sm">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {!activeAssignment.isOccupied ? (
                        <span className="text-slate-600 text-[11px]">No Device</span>
                      ) : isHost ? (
                        <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span>HOST DEVICE</span>
                        </span>
                      ) : isOnline ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>CONNECTED</span>
                        </span>
                      ) : session ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-bold inline-flex items-center gap-1">
                          <WifiOff className="w-3 h-3 text-rose-400" />
                          <span>OFFLINE</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Standby</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {row.status === 'RECORDED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>RECORDED</span>
                        </span>
                      ) : row.status === 'MISSED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/90 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>MISSED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          {row.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {row.event ? formatTimeMs(row.event.elapsedMs) : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {row.segment ? (
                        <div>
                          <span>{row.segment.fromCheckpointName} → {row.segment.toCheckpointName}</span>
                          {row.segment.isMultiCheckpointSpan && (
                            <div className="text-[10px] text-amber-400 font-bold">
                              Spanned {row.segment.missedCheckpointsCount} Missed CP
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-amber-300">
                      {row.segment ? row.segment.segmentPaceFormatted : '—'}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-300">
                      {row.segment ? row.segment.segmentSpeedFormatted : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Host Self-Assignment Button */}
                        <button
                          onClick={() => onAssignSelfToCheckpoint?.(row.checkpoint)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                            isHost
                              ? 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-sm shadow-cyan-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                          }`}
                          title={isHost ? "Currently assigned to Host" : "Assign Myself to this Checkpoint"}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isHost ? 'Host Assigned' : 'Assign Myself'}</span>
                        </button>

                        {/* QR Code / Join Code Modal Opener */}
                        <button
                          onClick={() => setSelectedQrCheckpoint(row.checkpoint)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Show QR Code & Join Code"
                        >
                          <QrCode className="w-4 h-4 text-cyan-400" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* QR Code Popup Modal */}
      {selectedQrCheckpoint && (
        <QrCodeModal
          isOpen={true}
          onClose={() => setSelectedQrCheckpoint(null)}
          race={race}
          checkpoint={selectedQrCheckpoint}
        />
      )}

      {/* Finish Race Confirmation Modal */}
      <ConfirmModal
        isOpen={showFinishConfirm}
        title="Finish runner?"
        message={`Runner: ${race.runnerName}\nCaptured Finish Time: ${formatTimeMs(pendingHostFinish?.elapsedMs || 0)}\n\nAuthoritative timestamp was recorded at the exact moment FINISH was pressed. Do you want to commit this finish event and conclude the race?`}
        confirmText="Yes"
        cancelText="No"
        variant="danger"
        isLoading={finishing}
        onConfirm={handleConfirmFinishRace}
        onCancel={handleCancelFinishRace}
      />

      {/* Reset Race Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Race Timings?"
        message="This will reset the race clock to READY status and clear all recorded checkpoint splits. Are you sure you want to proceed?"
        confirmText="Reset Race"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetRace();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

    </div>
  );
};
