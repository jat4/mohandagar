/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Race, 
  TimingEvent, 
  Checkpoint, 
  normalizeCheckpointType,
  isRaceRunning,
  isRaceFinished
} from '../../types/race';
import { 
  calculateRaceStatistics, 
  calculateLiveRunnerProgress, 
  formatDistance, 
  formatTimeMs 
} from '../../utils/raceCalculations';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  Flag, 
  Zap, 
  TrendingUp, 
  Gauge, 
  UserCheck, 
  AlertTriangle, 
  Compass,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface LiveRaceProgressTimelineProps {
  race: Race;
  events: TimingEvent[];
  currentCheckpointId?: string;
  staffName?: string;
  isHostView?: boolean;
  className?: string;
}

export const LiveRaceProgressTimeline: React.FC<LiveRaceProgressTimelineProps> = ({
  race,
  events,
  currentCheckpointId,
  staffName,
  isHostView = false,
  className = ''
}) => {
  const stats = calculateRaceStatistics(race, events);
  const liveProgress = calculateLiveRunnerProgress(race, events, stats);

  const isRunning = isRaceRunning(race.status);
  const isFinished = isRaceFinished(race.status);

  const lastRecorded = liveProgress.lastRecordedCheckpoint;
  const lastRecordedEvent = liveProgress.lastRecordedEvent;
  const nextPrediction = liveProgress.nextPrediction;
  const finishPrediction = liveProgress.finishPrediction;

  // Contextual staff alert message
  const getContextualStaffMessage = () => {
    if (isFinished) {
      return {
        badge: 'RACE FINISHED',
        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
        title: `Official Finish: ${formatTimeMs(race.finishTimestamp && race.startTimestamp ? race.finishTimestamp - race.startTimestamp : stats.totalTimeMs)}`,
        subtitle: `Runner ${race.runnerName} completed all course checkpoints.`
      };
    }

    if (!isRunning) {
      return {
        badge: 'READY TO START',
        badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/30',
        title: 'Awaiting Race Start',
        subtitle: 'Host will trigger the synchronized start countdown.'
      };
    }

    // Race is RUNNING
    if (!lastRecorded) {
      return {
        badge: 'RACE IN PROGRESS',
        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
        title: `Runner Started • En route to ${stats.processedCheckpoints[0]?.checkpoint.name || 'Checkpoint 1'}`,
        subtitle: 'Awaiting the first checkpoint split recording.'
      };
    }

    // If viewing device is the one that recorded the last checkpoint
    if (currentCheckpointId && currentCheckpointId === lastRecorded.checkpoint.id) {
      return {
        badge: 'RECORDED BY YOU',
        badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
        title: `YOU RECORDED ${lastRecorded.checkpoint.name} — ${lastRecorded.cumulativeElapsedFormatted}`,
        subtitle: `Segment: ${lastRecorded.segment?.segmentElapsedMs ? formatTimeMs(lastRecorded.segment.segmentElapsedMs) : '—'} • Pace: ${lastRecorded.segment?.segmentPaceFormatted || '—'} • Speed: ${lastRecorded.segment?.segmentSpeedFormatted || '—'}`
      };
    }

    // If viewing device is an upcoming checkpoint (e.g. CP3)
    if (currentCheckpointId) {
      const currentCpIndex = stats.processedCheckpoints.findIndex(c => c.checkpoint.id === currentCheckpointId);
      const lastRecIndex = liveProgress.lastRecordedIndex;

      if (currentCpIndex > lastRecIndex && currentCpIndex >= 0) {
        const myCp = stats.processedCheckpoints[currentCpIndex]?.checkpoint;
        const isFinishDevice = normalizeCheckpointType(myCp?.type) === 'finish';

        if (nextPrediction && nextPrediction.targetCheckpointId === currentCheckpointId) {
          return {
            badge: 'RUNNER APPROACHING',
            badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
            title: `Runner approaching ${myCp.name} — Estimated in ${nextPrediction.estimatedSegmentTimeFormatted}`,
            subtitle: `Expected arrival at ~${nextPrediction.expectedWallClockTimeFormatted} (Race time ${nextPrediction.estimatedRaceElapsedFormatted}) based on current pace ${nextPrediction.basedOnPaceFormatted}`
          };
        }

        if (isFinishDevice && finishPrediction) {
          return {
            badge: 'FINISH LINE MONITOR',
            badgeColor: 'bg-rose-950 text-rose-300 border-rose-500/40',
            title: `Runner at ${lastRecorded.checkpoint.name} — Estimated arrival at Finish Line ${finishPrediction.estimatedRaceElapsedFormatted}`,
            subtitle: `Expected at ~${finishPrediction.expectedWallClockTimeFormatted} (~in ${finishPrediction.estimatedSegmentTimeFormatted}) based on ${finishPrediction.basedOnPaceFormatted}`
          };
        }

        return {
          badge: 'AWAITING RUNNER',
          badgeColor: 'bg-slate-900 text-slate-300 border-slate-800',
          title: `Runner at ${lastRecorded.checkpoint.name} (${lastRecorded.cumulativeElapsedFormatted})`,
          subtitle: `En route to your position at ${myCp.name}.`
        };
      }
    }

    // Default Host or general staff message
    return {
      badge: 'LIVE RUNNER STATUS',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
      title: `Runner reached ${lastRecorded.checkpoint.name} — ${lastRecorded.cumulativeElapsedFormatted}`,
      subtitle: `Recorded by ${lastRecordedEvent?.staffName || 'Checkpoint Staff'} (${lastRecordedEvent?.deviceId || 'Staff Device'})`
    };
  };

  const contextMessage = getContextualStaffMessage();

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      
      {/* 1. Real-Time Runner Status Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold border ${contextMessage.badgeColor} flex items-center gap-1.5`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>{contextMessage.badge}</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              Runner: <strong className="text-slate-200">{race.runnerName}</strong>
            </span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Progress: <strong className="text-cyan-300">{stats.recordedCheckpointsCount}</strong> / {stats.totalCheckpointsCount} CPs
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>{contextMessage.title}</span>
          </h3>
          <p className="text-xs sm:text-sm font-mono text-slate-400">
            {contextMessage.subtitle}
          </p>
        </div>

        {/* Most Recent Split Metrics Snapshot */}
        {lastRecorded && lastRecorded.segment && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Checkpoint</span>
              <span className="font-bold text-slate-200 truncate block">{lastRecorded.checkpoint.name}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Recorded Split</span>
              <span className="font-bold text-cyan-300 block">{lastRecorded.cumulativeElapsedFormatted}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Segment Pace</span>
              <span className="font-bold text-amber-300 block">{lastRecorded.segment.segmentPaceFormatted}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Segment Speed</span>
              <span className="font-bold text-emerald-300 block">{lastRecorded.segment.segmentSpeedFormatted}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Next Checkpoint Prediction (Estimated Arrival) */}
      {isRunning && nextPrediction && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4 animate-spin text-cyan-400" style={{ animationDuration: '6s' }} />
              <span>Next Checkpoint Prediction</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              ESTIMATED ARRIVAL
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="text-lg sm:text-xl font-black text-slate-100">
                {nextPrediction.targetCheckpointName}
                {nextPrediction.isFinishLine && ' 🏁'}
              </div>
              <div className="text-xs font-mono text-cyan-300 mt-0.5">
                Remaining Distance: <strong>{formatDistance(nextPrediction.remainingDistanceMeters, race.displayUnit)}</strong> (From {nextPrediction.fromCheckpointName})
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[11px] font-mono text-slate-400">Estimated Arrival Time:</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                ~{nextPrediction.expectedWallClockTimeFormatted}
              </div>
            </div>
          </div>

          {/* Prediction Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-cyan-500/20 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 block uppercase">Estimated in</span>
              <span className="font-bold text-base text-slate-100 block mt-0.5">
                ~{nextPrediction.estimatedSegmentTimeFormatted}
              </span>
              <span className="text-[10px] text-slate-500 block">From last split</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 block uppercase">Race Elapsed Est.</span>
              <span className="font-bold text-base text-cyan-300 block mt-0.5">
                ~{nextPrediction.estimatedRaceElapsedFormatted}
              </span>
              <span className="text-[10px] text-slate-500 block">Cumulative race time</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 block uppercase">Based on Pace</span>
              <span className="font-bold text-base text-amber-300 block mt-0.5">
                {nextPrediction.basedOnPaceFormatted}
              </span>
              <span className="text-[10px] text-emerald-400 block font-semibold">{nextPrediction.basedOnSpeedFormatted}</span>
            </div>
          </div>

          {/* Official Disclaimer Badge */}
          <div className="pt-2 flex items-start gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Estimated Arrival</strong> calculated from actual measured segment speed ({nextPrediction.basedOnSpeedFormatted}). This is an estimate for staff coordination, not an official recorded time.
            </span>
          </div>
        </div>
      )}

      {/* 3. Real-Time Checkpoint Progression Timeline */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Race Checkpoint Progress</span>
            </h4>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Live progression and recorded timing splits across all race gates
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stats.recordedCheckpointsCount}/{stats.totalCheckpointsCount} Recorded
          </span>
        </div>

        {/* Timeline Items */}
        <div className="space-y-2.5">
          {/* Start Point */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <div>
                <span className="font-bold text-slate-100">START</span>
                <span className="text-slate-500 text-[11px] ml-2">0 m</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-emerald-400">00:00.000</span>
              <span className="text-[10px] text-slate-500 block">Race Start</span>
            </div>
          </div>

          {/* Checkpoint Steps */}
          {stats.processedCheckpoints.map((row, idx) => {
            const isLastRecorded = lastRecorded?.checkpoint.id === row.checkpoint.id;
            const isThisStaffScreen = currentCheckpointId === row.checkpoint.id;
            const isFinal = normalizeCheckpointType(row.checkpoint.type) === 'finish';
            const hasEvent = row.status === 'RECORDED' && row.event;

            return (
              <div
                key={row.checkpoint.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                  isLastRecorded
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                    : hasEvent
                    ? 'bg-slate-950/70 border-slate-800/90'
                    : row.status === 'MISSED'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : isThisStaffScreen
                    ? 'bg-slate-900 border-cyan-500/40'
                    : 'bg-slate-950/40 border-slate-800/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  {/* Left: Checkpoint Name & Status */}
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="shrink-0 mt-0.5 sm:mt-0">
                      {hasEvent ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      ) : row.status === 'MISSED' ? (
                        <div className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                          !
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-slate-500 border border-slate-800 flex items-center justify-center font-bold text-xs">
                          ○
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                          {row.checkpoint.name}
                        </span>
                        
                        {isFinal && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                            FINISH
                          </span>
                        )}

                        {isLastRecorded && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-400 text-slate-950 animate-pulse">
                            LAST RECORDED
                          </span>
                        )}

                        {isThisStaffScreen && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                            YOUR POSITION
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Distance: <strong className="text-slate-300">{formatDistance(row.checkpoint.distanceMeters, race.displayUnit)}</strong></span>
                        {row.event?.staffName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">Staff: <strong className="text-slate-300">{row.event.staffName}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Status */}
                  <div className="text-left sm:text-right pl-8 sm:pl-0 font-mono text-xs">
                    {hasEvent ? (
                      <div>
                        <div className="font-bold text-sm sm:text-base text-cyan-300">
                          {row.cumulativeElapsedFormatted}
                        </div>
                        {row.segment && (
                          <div className="text-[10px] text-slate-400 flex sm:justify-end gap-2 mt-0.5">
                            <span>Seg: <strong className="text-slate-300">{formatTimeMs(row.segment.segmentElapsedMs)}</strong></span>
                            <span>•</span>
                            <span className="text-amber-300 font-semibold">{row.segment.segmentPaceFormatted}</span>
                            <span>•</span>
                            <span className="text-emerald-300 font-semibold">{row.segment.segmentSpeedFormatted}</span>
                          </div>
                        )}
                      </div>
                    ) : row.status === 'MISSED' ? (
                      <div>
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                          MISSED (NO SPLIT)
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">Skipped during race</div>
                      </div>
                    ) : nextPrediction && nextPrediction.targetCheckpointId === row.checkpoint.id ? (
                      <div>
                        <div className="text-cyan-300 font-bold text-xs">
                          Est: ~{nextPrediction.expectedWallClockTimeFormatted}
                        </div>
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold">
                          APPROACHING
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-bold border border-slate-800">
                        {row.status === 'PENDING' ? 'PENDING' : 'UPCOMING'}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
