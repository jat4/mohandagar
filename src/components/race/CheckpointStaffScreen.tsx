/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Race, 
  Checkpoint, 
  TimingEvent, 
  StaffSession, 
  normalizeCheckpointType,
  isSplitAllowed,
  isFinishAllowed,
  isRaceRunning,
  isRaceFinished,
  isRaceWaiting
} from '../../types/race';
import { RaceService } from '../../services/raceService';
import { useTimeSync, TimeSyncService } from '../../services/timeSyncService';
import { formatDistance, formatTimeMs, calculateRaceStatistics } from '../../utils/raceCalculations';
import { RaceTimerClock } from './RaceTimerClock';
import { LiveRaceProgressTimeline } from './LiveRaceProgressTimeline';
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
  StopCircle,
  Trophy
} from 'lucide-react';

interface CheckpointStaffScreenProps {
  race: Race;
  checkpoint: Checkpoint;
  events: TimingEvent[];
  staffName: string;
  deviceName: string;
  isHost?: boolean;
  onExit: () => void;
  onViewResult?: () => void;
}

export const CheckpointStaffScreen: React.FC<CheckpointStaffScreenProps> = ({
  race,
  checkpoint,
  events,
  staffName,
  deviceName,
  isHost,
  onExit,
  onViewResult
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'SAVED' | 'SYNCING' | 'FAILED' | 'READY'>('READY');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const [pendingFinish, setPendingFinish] = useState<{
    capturedTimestamp: number;
    capturedElapsedMs: number;
    checkpointId: string;
    checkpointName: string;
    checkpointDistanceMeters: number;
  } | null>(null);
  const lastRecordedAtRef = useRef<number>(0);
  const timeSync = useTimeSync();
  const [recalibrating, setRecalibrating] = useState(false);

  const sessionId = useRef(() => {
    const key = `checkpoint_staff_session_${checkpoint.id}`;
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const generated = `session_${checkpoint.id}_${Date.now()}`;
    localStorage.setItem(key, generated);
    return generated;
  }).current();

  // Heartbeat loop & network sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      TimeSyncService.sync();
      RaceService.updateStaffHeartbeat(race.id, sessionId, {
        checkpointId: checkpoint.id,
        staffName,
        deviceName,
        status: 'ONLINE'
      });
    };
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
  const stats = calculateRaceStatistics(race, events);
  const thisCpResult = stats.processedCheckpoints.find((c) => c.checkpoint.id === checkpoint.id);

  // Debounced SPLIT trigger (for Split Gates)
  const handleRecordSplit = async () => {
    if (!race.startTimestamp || !isRaceRunning(race.status)) {
      showToast({ type: 'warning', title: 'Race Not Running', message: 'The race has not been started yet by the Host.' });
      return;
    }

    if (!isSplitAllowed(checkpoint.type)) {
      showToast({ type: 'error', title: 'Action Not Allowed', message: 'This is a Finish Line checkpoint. Only finish events can be recorded.' });
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
        raceStartTimestamp: race.startTimestamp,
        checkpointType: checkpoint.type
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

  // Immediate Authoritative FINISH Capture (Captured BEFORE opening confirmation dialog)
  const handleTriggerFinishCapture = () => {
    if (!race.startTimestamp || !isRaceRunning(race.status)) {
      showToast({ type: 'warning', title: 'Race Not Running', message: 'The race is not currently in progress.' });
      return;
    }

    if (submitting || pendingFinish) {
      return; // Prevent duplicate button presses or concurrent submissions
    }

    // 1. Immediately capture exact authoritative timestamp from synchronized clock
    const finishPressedAt = TimeSyncService.now();
    const finishElapsedMs = Math.max(0, finishPressedAt - race.startTimestamp);

    // 2. Store locked timestamp in state
    setPendingFinish({
      capturedTimestamp: finishPressedAt,
      capturedElapsedMs: finishElapsedMs,
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
      checkpointDistanceMeters: checkpoint.distanceMeters,
    });

    // 3. Open confirmation dialog to decide whether to COMMIT the already captured event
    setShowFinishConfirmModal(true);
  };

  // User pressed YES: Commit the previously captured finish event
  const handleConfirmFinish = async () => {
    if (!pendingFinish || !race.startTimestamp) return;

    setSubmitting(true);
    setSyncStatus('SYNCING');

    try {
      await RaceService.recordTimingEvent({
        raceId: race.id,
        checkpointId: pendingFinish.checkpointId,
        checkpointName: pendingFinish.checkpointName,
        checkpointDistanceMeters: pendingFinish.checkpointDistanceMeters,
        eventType: 'FINISH',
        staffName,
        deviceId: deviceName,
        raceStartTimestamp: race.startTimestamp,
        capturedTimestamp: pendingFinish.capturedTimestamp,
        capturedElapsedMs: pendingFinish.capturedElapsedMs,
        checkpointType: checkpoint.type
      });
      setSyncStatus('SAVED');
      setShowFinishConfirmModal(false);
      const finishedTimeStr = formatTimeMs(pendingFinish.capturedElapsedMs);
      setPendingFinish(null);
      showToast({
        type: 'success',
        title: 'Official Finish Recorded!',
        message: `Official finish time recorded: ${finishedTimeStr} at ${checkpoint.name}.`
      });
    } catch (err: any) {
      console.error('Error recording finish:', err);
      setSyncStatus('FAILED');
      showToast({
        type: 'error',
        title: 'Finish Failed',
        message: err.message || 'Failed to finalize race finish.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // User pressed NO: Discard pending finish, race remains RUNNING and timer continues seamlessly
  const handleCancelFinish = () => {
    setShowFinishConfirmModal(false);
    setPendingFinish(null);
  };

  const normalizedType = normalizeCheckpointType(checkpoint.type);
  const isStartOnly = normalizedType === 'start' || checkpoint.isStart;
  const isFinishOnly = !isStartOnly && normalizedType === 'finish';
  const isSplitOnly = !isStartOnly && normalizedType === 'splitOnly';
  const isSplitFinish = !isStartOnly && normalizedType === 'splitFinish';

  const isRunning = isRaceRunning(race.status);
  const isFinished = isRaceFinished(race.status);
  const isWaiting = isRaceWaiting(race.status);

  // START trigger for Start Line staff
  const handleRecordStart = async () => {
    if (isRunning || isFinished) {
      return;
    }
    setSubmitting(true);
    setSyncStatus('SYNCING');
    try {
      const startTimestamp = TimeSyncService.now();
      await RaceService.startRace(race.id, {
        startCheckpointId: checkpoint.id,
        staffName,
        deviceId: deviceName,
        startTimestamp
      });
      setSyncStatus('SAVED');
      showToast({ 
        type: 'success', 
        title: 'Race Started!', 
        message: 'Synchronized race timer started across all staff devices.' 
      });
    } catch (err: any) {
      console.error('Error starting race:', err);
      setSyncStatus('FAILED');
      showToast({ 
        type: 'error', 
        title: 'Start Failed', 
        message: err.message || 'Failed to start race.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

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
                {isStartOnly ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    🚦 START LINE (START ONLY) 🔒
                  </span>
                ) : isFinishOnly ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                    🏁 FINISH LINE (FINISH ONLY) 🔒
                  </span>
                ) : isSplitFinish ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    ⚡ SPLIT GATE (SPLIT & FINISH)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    ⚡ SPLIT (SPLIT ONLY)
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 truncate">
                {checkpoint.name}
              </h1>
              <div className="text-xs sm:text-sm font-mono text-cyan-300 font-semibold mt-0.5">
                Distance: {isStartOnly ? '0 m (Fixed)' : formatDistance(checkpoint.distanceMeters, race.displayUnit)}
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
            {isWaiting && (
              <span className="text-amber-400 font-semibold">Waiting for Host to start race...</span>
            )}
            {isRunning && (
              <span className="text-emerald-400 font-bold animate-pulse">● RACE IN PROGRESS</span>
            )}
            {isFinished && (
              <span className="text-slate-400 font-bold">● RACE COMPLETED</span>
            )}
          </div>
        </div>

        {/* Recorded Split/Finish Confirmation Banner */}
        {hasRecorded && thisCheckpointEvent && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-left space-y-2.5 shadow-lg animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-emerald-200 uppercase tracking-wider">
                  ✓ {thisCheckpointEvent.eventType === 'FINISH' ? 'OFFICIAL FINISH RECORDED' : 'SPLIT RECORDED'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                SYNCHRONIZED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 block">Checkpoint</span>
                <strong className="text-slate-100">{checkpoint.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Split Time</span>
                <strong className="text-cyan-300">{formatTimeMs(thisCheckpointEvent.elapsedMs)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Segment Time</span>
                <strong className="text-slate-100">
                  {thisCpResult?.segment ? formatTimeMs(thisCpResult.segment.segmentElapsedMs) : formatTimeMs(thisCheckpointEvent.elapsedMs)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Pace / Speed</span>
                <strong className="text-amber-300">{thisCpResult?.segment?.segmentPaceFormatted || '—'}</strong>{' '}
                <span className="text-emerald-300 text-[10px]">({thisCpResult?.segment?.segmentSpeedFormatted || '—'})</span>
              </div>
            </div>

            <div className="text-[10px] text-emerald-400/80 border-t border-emerald-500/20 pt-1.5 flex flex-wrap items-center justify-between gap-1">
              <span>Recorded by: <strong>{thisCheckpointEvent.staffName || staffName}</strong> ({thisCheckpointEvent.deviceId || deviceName})</span>
              <span>Broadcast to Host & all checkpoints</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area: Authority-Based Buttons */}
      <div className="space-y-3">
        {/* START LINE CONTROLS */}
        {isStartOnly && isWaiting && (
          <div className="space-y-2">
            <button
              onClick={handleRecordStart}
              disabled={submitting}
              className="w-full py-5 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer min-h-[60px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30 active:scale-[0.98]"
            >
              <Zap className="w-6 h-6 fill-current text-slate-950" />
              <span>START RACE</span>
            </button>
            <div className="text-center text-[11px] font-mono text-slate-400">
              Start Line • Authoritative Race Start (Locks after starting) 🔒
            </div>
          </div>
        )}

        {isStartOnly && isRunning && (
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-5 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl bg-slate-900 border border-emerald-500/40 text-emerald-400 cursor-default min-h-[60px]"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>RACE STARTED</span>
            </button>
            <div className="text-center text-[11px] font-mono text-slate-400">
              Start Line • Race in progress (Recorded at 00:00.000) 🔒
            </div>
          </div>
        )}

        {/* NON-START CHECKPOINT RUNNING CONTROLS */}
        {!isStartOnly && isRunning && (
          <div className="space-y-3">
            
            {/* CASE 1: Finish Line (Finish ONLY - NO Split Button) */}
            {isFinishOnly && (
              <div className="space-y-2">
                <button
                  onClick={handleTriggerFinishCapture}
                  disabled={submitting || (hasRecorded && thisCheckpointEvent?.eventType === 'FINISH') || Boolean(pendingFinish)}
                  className={`w-full py-5 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer min-h-[60px] ${
                    hasRecorded && thisCheckpointEvent?.eventType === 'FINISH'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30 active:scale-[0.98]'
                  }`}
                >
                  <Flag className="w-6 h-6" />
                  <span>{hasRecorded && thisCheckpointEvent?.eventType === 'FINISH' ? 'FINISH RECORDED' : 'FINISH'}</span>
                </button>
                <div className="text-center text-[11px] font-mono text-slate-400">
                  Finish Line • Finish Only (No Split) 🔒
                </div>
              </div>
            )}

            {/* CASE 2: Split (Split ONLY - NO Finish Button) */}
            {isSplitOnly && (
              <div className="space-y-2">
                <button
                  onClick={handleRecordSplit}
                  disabled={submitting || (hasRecorded && thisCheckpointEvent?.eventType === 'SPLIT') || Boolean(pendingFinish)}
                  className={`w-full py-5 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer min-h-[60px] ${
                    hasRecorded && thisCheckpointEvent?.eventType === 'SPLIT'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 active:scale-[0.98]'
                  }`}
                >
                  <Zap className="w-6 h-6 fill-current" />
                  <span>{hasRecorded && thisCheckpointEvent?.eventType === 'SPLIT' ? 'SPLIT RECORDED' : 'SPLIT'}</span>
                </button>
                <div className="text-center text-[11px] font-mono text-slate-400">
                  Split • Split Only (No Finish)
                </div>
              </div>
            )}

            {/* CASE 3: Split Gate (Split & Finish - Allows BOTH [SPLIT] and [FINISH]) */}
            {isSplitFinish && (
              <div className="space-y-2.5">
                {/* [SPLIT] Button */}
                <button
                  onClick={handleRecordSplit}
                  disabled={submitting || (hasRecorded && thisCheckpointEvent?.eventType === 'SPLIT') || Boolean(pendingFinish)}
                  className={`w-full py-4 sm:py-5 rounded-2xl font-mono text-base sm:text-xl font-black flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer min-h-[56px] ${
                    hasRecorded && thisCheckpointEvent?.eventType === 'SPLIT'
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 active:scale-[0.98]'
                  }`}
                >
                  <Zap className="w-5 h-5 fill-current" />
                  <span>{hasRecorded && thisCheckpointEvent?.eventType === 'SPLIT' ? 'SPLIT RECORDED' : 'SPLIT'}</span>
                </button>

                {/* [FINISH] Button */}
                <button
                  onClick={handleTriggerFinishCapture}
                  disabled={submitting || (hasRecorded && thisCheckpointEvent?.eventType === 'FINISH') || Boolean(pendingFinish)}
                  className={`w-full py-3.5 sm:py-4 rounded-xl font-mono text-sm sm:text-base font-bold bg-slate-900 hover:bg-rose-950/90 text-rose-400 hover:text-rose-300 border border-rose-900/60 hover:border-rose-500/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer min-h-[48px] ${
                    hasRecorded && thisCheckpointEvent?.eventType === 'FINISH'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'active:scale-[0.98]'
                  }`}
                >
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span>{hasRecorded && thisCheckpointEvent?.eventType === 'FINISH' ? 'FINISH RECORDED' : 'FINISH'}</span>
                </button>
                <div className="text-center text-[10px] font-mono text-slate-500">
                  Split Gate (Split & Finish) • Press [SPLIT] for interval split, or [FINISH] to end race here
                </div>
              </div>
            )}

          </div>
        )}

        {isFinished && (
          <div className="space-y-3">
            <button
              id="btn-view-result"
              onClick={() => {
                if (onViewResult) {
                  onViewResult();
                } else {
                  navigate(`/activity/${race.id}`);
                }
              }}
              className="w-full py-5 sm:py-6 rounded-2xl font-mono text-lg sm:text-2xl font-black bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:via-teal-300 hover:to-emerald-300 text-slate-950 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer min-h-[60px]"
            >
              <Trophy className="w-6 h-6 text-slate-950" />
              <span>View Result</span>
            </button>
            <div className="text-center text-[11px] font-mono text-slate-400">
              Race Completed • View full results and export race report
            </div>
          </div>
        )}

        {!isStartOnly && isWaiting && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
            Stay on this screen. As soon as the Host or Start Line staff triggers Start, the live clock and action buttons will activate automatically.
          </div>
        )}
      </div>

      {/* Real-Time Live Checkpoint Progress & Predictions */}
      <LiveRaceProgressTimeline
        race={race}
        events={events}
        currentCheckpointId={checkpoint.id}
        staffName={staffName}
      />

      {/* Finish Race Confirmation Modal */}
      <ConfirmModal
        isOpen={showFinishConfirmModal}
        title="Finish runner?"
        message={`Runner: ${race.runnerName}\nCaptured Finish Time: ${formatTimeMs(pendingFinish?.capturedElapsedMs || 0)}\n\nAuthoritative timestamp was captured at the exact moment FINISH was pressed. Do you want to commit this finish event?`}
        confirmText="Yes"
        cancelText="No"
        variant="danger"
        isLoading={submitting}
        onConfirm={handleConfirmFinish}
        onCancel={handleCancelFinish}
      />

    </div>
  );
};
