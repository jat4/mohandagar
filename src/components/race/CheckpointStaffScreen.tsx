/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Race, 
  Checkpoint, 
  TimingEvent, 
  StaffSession 
} from '../../types/race';
import { RaceService } from '../../services/raceService';
import { useTimeSync } from '../../services/timeSyncService';
import { formatDistance, formatTimeMs, calculateRaceStatistics } from '../../utils/raceCalculations';
import { RaceTimerClock } from './RaceTimerClock';
import { ActivityExportCard } from './ActivityExportCard';
import { ConfirmModal } from '../common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  Flag, 
  Sparkles, 
  Timer, 
  User, 
  Share2, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Info, 
  RefreshCw,
  AlertTriangle,
  StopCircle
} from 'lucide-react';

interface CheckpointStaffScreenProps {
  race: Race;
  checkpoint: Checkpoint;
  events: TimingEvent[];
  staffName: string;
  deviceName: string;
  isHost?: boolean;
  onExit: () => void;
}

export const CheckpointStaffScreen: React.FC<CheckpointStaffScreenProps> = ({
  race,
  checkpoint,
  events,
  staffName,
  deviceName,
  isHost,
  onExit
}) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'SAVED' | 'SYNCING' | 'FAILED' | 'READY'>('READY');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showExport, setShowExport] = useState(false);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const lastRecordedAtRef = useRef<number>(0);
  const timeSync = useTimeSync();
  const [recalibrating, setRecalibrating] = useState(false);

  const sessionId = useRef(`session_${checkpoint.id}_${Date.now()}`).current;

  // Heartbeat loop
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial heartbeat
    RaceService.updateStaffHeartbeat(race.id, sessionId, {
      id: sessionId,
      raceId: race.id,
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
      checkpointDistanceMeters: checkpoint.distanceMeters,
      staffName,
      deviceName,
      joinedAt: Date.now(),
      status: 'ONLINE',
      isHost: !!isHost
    });

    // Periodic heartbeat every 12s
    const heartbeatInterval = setInterval(() => {
      if (navigator.onLine) {
        RaceService.updateStaffHeartbeat(race.id, sessionId, {
          checkpointId: checkpoint.id,
          staffName,
          deviceName,
          status: 'ONLINE'
        });
      }
    }, 12000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeatInterval);
    };
  }, [race.id, checkpoint.id, staffName, deviceName, isHost, sessionId]);

  // Check if this checkpoint has already recorded a split or finish
  const thisCheckpointEvent = events.find((e) => e.checkpointId === checkpoint.id);
  const hasRecorded = !!thisCheckpointEvent;

  // Debounced SPLIT trigger
  const handleRecordSplit = async () => {
    if (!race.startTimestamp || race.status !== 'RUNNING') {
      showToast({ type: 'warning', title: 'Race Not Running', message: 'The race has not been started yet by the Host.' });
      return;
    }

    const now = Date.now();
    // 2-second debounce protection against accidental double tapping
    if (now - lastRecordedAtRef.current < 2000) {
      return;
    }
    lastRecordedAtRef.current = now;

    setSubmitting(true);
    setSyncStatus('SYNCING');

    try {
      await RaceService.recordTimingEvent({
        raceId: race.id,
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.name,
        checkpointDistanceMeters: checkpoint.distanceMeters,
        eventType: 'SPLIT',
        staffName,
        deviceId: deviceName,
        raceStartTimestamp: race.startTimestamp
      });
      setSyncStatus('SAVED');
      showToast({ type: 'success', title: 'Split Recorded!', message: `Split captured at ${checkpoint.name}.` });
    } catch (err: any) {
      console.error('Error recording split:', err);
      setSyncStatus('FAILED');
      showToast({ type: 'error', title: 'Record Failed', message: err.message || 'Failed to record split to cloud.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Debounced FINISH trigger (End race at this checkpoint)
  const handleExecuteFinish = async () => {
    if (!race.startTimestamp || race.status !== 'RUNNING') {
      showToast({ type: 'warning', title: 'Race Not Running', message: 'The race is not currently in progress.' });
      return;
    }

    const now = Date.now();
    lastRecordedAtRef.current = now;

    setSubmitting(true);
    setSyncStatus('SYNCING');

    try {
      await RaceService.recordTimingEvent({
        raceId: race.id,
        checkpointId: checkpoint.id,
        checkpointName: checkpoint.name,
        checkpointDistanceMeters: checkpoint.distanceMeters,
        eventType: 'FINISH',
        staffName,
        deviceId: deviceName,
        raceStartTimestamp: race.startTimestamp
      });
      setSyncStatus('SAVED');
      setShowFinishConfirmModal(false);
      showToast({ type: 'success', title: 'Official Finish Recorded!', message: `Race officially completed at ${checkpoint.name} (${formatDistance(checkpoint.distanceMeters, race.displayUnit)}).` });
    } catch (err: any) {
      console.error('Error recording finish:', err);
      setSyncStatus('FAILED');
      showToast({ type: 'error', title: 'Finish Failed', message: err.message || 'Failed to finalize race finish.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isFinalGate = checkpoint.id === race.checkpoints[race.checkpoints.length - 1]?.id;
  const hasSplitAndFinishAuthority = checkpoint.type === 'SPLIT_AND_FINISH' || isHost;
  const isRunning = race.status === 'RUNNING';
  const isFinished = race.status === 'FINISHED';

  const stats = calculateRaceStatistics(race, events);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 max-w-lg mx-auto space-y-4 sm:space-y-6">
      
      {/* Top Header Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Screen</span>
          </button>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>OFFLINE</span>
              </span>
            )}

            {syncStatus === 'SYNCING' && (
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono animate-pulse">
                SYNCING...
              </span>
            )}
            {syncStatus === 'SAVED' && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono">
                SAVED ✓
              </span>
            )}
            {syncStatus === 'FAILED' && (
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono">
                RETRY ⚠
              </span>
            )}
          </div>
        </div>

        {/* Checkpoint & Runner Header Card */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {isFinalGate ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                    🏁 OFFICIAL FINISH GATE
                  </span>
                ) : checkpoint.type === 'SPLIT_AND_FINISH' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                    ⚡ SPLIT OR FINISH AUTHORITY
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    ⚡ SPLIT ONLY
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 truncate">
                {checkpoint.name}
              </h1>
              <div className="text-xs sm:text-sm font-mono text-cyan-300 font-semibold mt-0.5">
                Distance: {formatDistance(checkpoint.distanceMeters, race.displayUnit)}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-slate-400 block">Race</span>
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px] sm:max-w-[150px]">
                {race.name}
              </span>
              <span className="text-xs text-slate-300 font-mono font-bold block mt-0.5">
                Runner: <span className="text-cyan-300">{race.runnerName}</span>
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>Staff: <strong className="text-slate-200">{staffName}</strong></div>
            <div>Device: <strong className="text-slate-300">{deviceName}</strong></div>
          </div>
        </div>
      </div>

      {/* Center Live Stopwatch Block */}
      <div className="my-2 sm:my-4 text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Synchronized Race Time</span>
          </span>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${
              timeSync.isSynced ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span>Sync: {timeSync.offsetMs >= 0 ? `+${timeSync.offsetMs}ms` : `${timeSync.offsetMs}ms`}</span>
            <button
              onClick={async () => {
                setRecalibrating(true);
                await timeSync.recalibrate();
                setRecalibrating(false);
              }}
              disabled={recalibrating}
              title="Calibrate device clock"
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer disabled:opacity-50 ml-0.5"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${recalibrating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
          <RaceTimerClock
            startTimestamp={race.startTimestamp}
            finishTimestamp={race.finishTimestamp}
            isRunning={isRunning}
            size="lg"
            className="text-cyan-300 py-1"
          />

          <div className="mt-2 text-xs font-mono">
            {race.status === 'READY' && (
              <span className="text-amber-400">Waiting for Host to start race...</span>
            )}
            {race.status === 'RUNNING' && (
              <span className="text-emerald-400 font-bold animate-pulse">● RACE IN PROGRESS</span>
            )}
            {race.status === 'FINISHED' && (
              <span className="text-slate-400 font-bold">● RACE COMPLETED</span>
            )}
          </div>
        </div>

        {/* Recorded Split/Finish Confirmation Banner */}
        {hasRecorded && thisCheckpointEvent && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-left flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  {thisCheckpointEvent.eventType === 'FINISH' ? 'Official Finish Recorded' : 'Checkpoint Split Recorded'}: {formatTimeMs(thisCheckpointEvent.elapsedMs)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-400/80">Saved & Synchronized to Cloud Database</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area: Authority-Based Buttons */}
      <div className="space-y-3">
        {isRunning && (
          <div className="space-y-3">
            
            {/* CASE 1: Official Finish Gate */}
            {isFinalGate ? (
              <button
                onClick={() => setShowFinishConfirmModal(true)}
                disabled={submitting || hasRecorded}
                className={`w-full py-4 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer min-h-[56px] ${
                  hasRecorded
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30 active:scale-[0.98]'
                }`}
              >
                <Flag className="w-5 h-5 sm:w-6 h-6" />
                <span>{hasRecorded ? 'FINISH RECORDED' : 'RECORD OFFICIAL FINISH'}</span>
              </button>
            ) : checkpoint.type === 'SPLIT_AND_FINISH' ? (
              /* CASE 2: Intermediate Checkpoint WITH Split + Finish Authority */
              <div className="space-y-2.5">
                {/* Primary Button: Record Split */}
                <button
                  onClick={handleRecordSplit}
                  disabled={submitting || hasRecorded}
                  className={`w-full py-4 sm:py-5 rounded-2xl font-mono text-base sm:text-xl font-black flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer min-h-[52px] ${
                    hasRecorded
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 active:scale-[0.98]'
                  }`}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>{hasRecorded ? 'SPLIT RECORDED' : 'RECORD SPLIT'}</span>
                </button>

                {/* Secondary Authority Button: Runner Stopped / Finish Race Here */}
                {!hasRecorded && (
                  <button
                    onClick={() => setShowFinishConfirmModal(true)}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-rose-900/50 hover:border-rose-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                  >
                    <StopCircle className="w-4 h-4 text-rose-400" />
                    <span>Runner Stopped Here? End & Finish Race</span>
                  </button>
                )}
              </div>
            ) : (
              /* CASE 3: Intermediate Checkpoint with SPLIT ONLY Authority */
              <div className="space-y-2">
                <button
                  onClick={handleRecordSplit}
                  disabled={submitting || hasRecorded}
                  className={`w-full py-4 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer min-h-[56px] ${
                    hasRecorded
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 active:scale-[0.98]'
                  }`}
                >
                  <Zap className="w-5 h-5 sm:w-6 h-6 fill-current" />
                  <span>{hasRecorded ? 'SPLIT RECORDED' : 'RECORD SPLIT'}</span>
                </button>
                <div className="text-center text-[10px] font-mono text-slate-500">
                  Checkpoint Authority: Split Recording Only
                </div>
              </div>
            )}

            {/* Host Emergency Override if timing as host */}
            {isHost && !isFinalGate && checkpoint.type === 'SPLIT' && !hasRecorded && (
              <button
                onClick={() => setShowFinishConfirmModal(true)}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Host Override: Finish Race Here</span>
              </button>
            )}

          </div>
        )}

        {isFinished && (
          <div className="space-y-3">
            <button
              onClick={() => setShowExport(!showExport)}
              className="w-full py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{showExport ? 'Hide Export Card' : 'Export Checkpoint Result (PNG/JPEG)'}</span>
            </button>

            {showExport && (
              <div className="pt-2 animate-fadeIn">
                <ActivityExportCard
                  stats={stats}
                  isStaffSpecific={true}
                  staffCheckpointName={checkpoint.name}
                  customTitle={`Checkpoint Split Result: ${checkpoint.name}`}
                />
              </div>
            )}
          </div>
        )}

        {race.status === 'READY' && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
            Stay on this screen. As soon as the Host triggers Start, the live clock and action buttons will activate automatically.
          </div>
        )}
      </div>

      {/* Finish Race Confirmation Modal */}
      <ConfirmModal
        isOpen={showFinishConfirmModal}
        title={isFinalGate ? "Record Official Finish?" : `Finish Race at ${checkpoint.name}?`}
        message={
          isFinalGate 
            ? `Are you sure you want to record the official finish time for runner "${race.runnerName}"?`
            : `Did runner "${race.runnerName}" stop or complete their run early at this checkpoint (${formatDistance(checkpoint.distanceMeters, race.displayUnit)})? This will record the official finish time and end the race.`
        }
        confirmText="Yes, Finish Race"
        cancelText="Cancel"
        variant="danger"
        isLoading={submitting}
        onConfirm={handleExecuteFinish}
        onCancel={() => setShowFinishConfirmModal(false)}
      />

    </div>
  );
};
