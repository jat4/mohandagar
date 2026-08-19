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
  RefreshCw
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
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'SAVED' | 'SYNCING' | 'FAILED' | 'READY'>('READY');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showExport, setShowExport] = useState(false);
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

  // Check if this checkpoint has already recorded a split
  const thisCheckpointEvent = events.find((e) => e.checkpointId === checkpoint.id);
  const hasRecorded = !!thisCheckpointEvent;

  // Debounced SPLIT trigger
  const handleRecordSplit = async () => {
    if (!race.startTimestamp || race.status !== 'RUNNING') {
      alert('Race is not currently running!');
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
    } catch (err) {
      console.error('Error recording split:', err);
      setSyncStatus('FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  // Debounced FINISH trigger
  const handleRecordFinish = async () => {
    if (!race.startTimestamp || race.status !== 'RUNNING') {
      alert('Race is not currently running!');
      return;
    }

    if (!confirm(`Are you sure you want to trigger FINISH for ${race.runnerName}?`)) {
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
    } catch (err) {
      console.error('Error recording finish:', err);
      setSyncStatus('FAILED');
    } finally {
      setSubmitting(false);
    }
  };

  const isFinishPermitted = checkpoint.type === 'SPLIT_AND_FINISH' || isHost;
  const isRunning = race.status === 'RUNNING';
  const isFinished = race.status === 'FINISHED';

  const stats = calculateRaceStatistics(race, events);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      
      {/* Top Header Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
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
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                Assigned Checkpoint
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5">
                {checkpoint.name}
              </h1>
              <div className="text-sm font-mono text-slate-300 font-semibold mt-0.5">
                Distance: {formatDistance(checkpoint.distanceMeters, race.displayUnit)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">Race</span>
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px]">
                {race.name}
              </span>
              <span className="text-xs text-cyan-300 font-mono block">
                Runner: {race.runnerName} (#{race.runnerBib})
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div>Staff: <strong className="text-slate-200">{staffName}</strong></div>
            <div>Device: <strong className="text-slate-300">{deviceName}</strong></div>
          </div>
        </div>
      </div>

      {/* Center Live Stopwatch Block */}
      <div className="my-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Synchronized Race Time</span>
          </span>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
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

        <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
          <RaceTimerClock
            startTimestamp={race.startTimestamp}
            finishTimestamp={race.finishTimestamp}
            isRunning={isRunning}
            size="lg"
            className="text-cyan-300"
          />

          <div className="mt-3 text-xs font-mono">
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

        {/* Recorded Split Confirmation Banner */}
        {hasRecorded && thisCheckpointEvent && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-left flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div>Recorded Split: <strong>{formatTimeMs(thisCheckpointEvent.elapsedMs)}</strong></div>
                <div className="text-[10px] text-emerald-400/80">Saved to Cloud Database</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Area: Big Touch-Friendly Buttons */}
      <div className="space-y-3">
        {isRunning && (
          <div className="space-y-3">
            {/* If checkpoint is Finish Gate: Show ONLY Big Red Finish Button */}
            {checkpoint.type === 'SPLIT_AND_FINISH' ? (
              <button
                onClick={handleRecordFinish}
                disabled={submitting || hasRecorded}
                className={`w-full py-6 rounded-2xl font-mono text-xl sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer ${
                  hasRecorded
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/30 active:scale-[0.98]'
                }`}
              >
                <Flag className="w-6 h-6" />
                <span>{hasRecorded ? 'FINISH RECORDED' : 'RECORD OFFICIAL FINISH'}</span>
              </button>
            ) : (
              /* If checkpoint is Intermediate Split: Show ONLY Big Cyan Split Button */
              <button
                onClick={handleRecordSplit}
                disabled={submitting || hasRecorded}
                className={`w-full py-6 rounded-2xl font-mono text-xl sm:text-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer ${
                  hasRecorded
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/30 active:scale-[0.98]'
                }`}
              >
                <Zap className="w-6 h-6" />
                <span>{hasRecorded ? 'SPLIT RECORDED' : 'RECORD SPLIT'}</span>
              </button>
            )}

            {/* If user is Host viewing on phone, allow emergency Host Finish trigger if needed */}
            {isHost && checkpoint.type === 'SPLIT' && (
              <button
                onClick={handleRecordFinish}
                disabled={submitting}
                className="w-full py-3 rounded-xl font-mono text-xs font-bold bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-900/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Host Override: Stop & Finish Race</span>
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
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
            Stay on this screen. As soon as the Host triggers Start, the live clock and SPLIT button will activate.
          </div>
        )}
      </div>

    </div>
  );
};
