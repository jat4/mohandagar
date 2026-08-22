/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Race, 
  TimingEvent, 
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
  Compass,
  Info,
  MapPin,
  Timer,
  Target,
  Layers,
  ArrowRight
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
  const lastRecordedIndex = liveProgress.lastRecordedIndex;
  const nextCheckpoint = liveProgress.nextCheckpoint;
  const nextPrediction = liveProgress.nextPrediction;

  // Status Badge Colors & Label
  const getStatusBadgeConfig = () => {
    switch (liveProgress.runnerStatusState) {
      case 'FINISHED':
        return {
          bg: 'bg-slate-800 text-slate-200 border-slate-700',
          dot: 'bg-slate-400',
          pulse: false
        };
      case 'CHECKPOINT_REACHED':
        return {
          bg: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
          dot: 'bg-cyan-400',
          pulse: true
        };
      case 'RUNNING':
        return {
          bg: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          pulse: true
        };
      case 'WAITING_FOR_START':
      default:
        return {
          bg: 'bg-amber-950 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400',
          pulse: false
        };
    }
  };

  const statusBadge = getStatusBadgeConfig();

  // Contextual Staff Alert when viewing on a specific checkpoint device
  const getContextualStaffAlert = () => {
    if (!currentCheckpointId || isHostView) return null;

    const myCpIndex = stats.processedCheckpoints.findIndex(c => c.checkpoint.id === currentCheckpointId);
    if (myCpIndex < 0) return null;

    const myCp = stats.processedCheckpoints[myCpIndex]?.checkpoint;
    const isRecordedAtMyCp = stats.processedCheckpoints[myCpIndex]?.status === 'RECORDED';

    if (isRecordedAtMyCp) {
      return (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Recorded at your checkpoint (<strong>{myCp.name}</strong>)</span>
          </div>
          <span className="text-[11px] text-cyan-300 font-bold">
            {stats.processedCheckpoints[myCpIndex].cumulativeElapsedFormatted}
          </span>
        </div>
      );
    }

    if (nextCheckpoint && nextCheckpoint.id === currentCheckpointId && nextPrediction) {
      const isFinishTarget = normalizeCheckpointType(myCp.type) === 'finish';
      return (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs font-mono text-emerald-200 flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
            <span>
              Runner approaching your station: <strong>{myCp.name}</strong>
              {isFinishTarget && ' (Finish Line)'}
            </span>
          </div>
          <span className="text-[11px] text-emerald-300 font-bold">
            Est. Arrival: {nextPrediction.expectedWallClockTimeFormatted} (~in {nextPrediction.estimatedSegmentTimeFormatted})
          </span>
        </div>
      );
    }

    return null;
  };

  const staffAlert = getContextualStaffAlert();

  return (
    <div id="live-runner-progress-container" className={`space-y-4 sm:space-y-6 ${className}`}>
      
      {/* Contextual Alert for Checkpoint Staff */}
      {staffAlert}

      {/* 1. CURRENT RUNNER STATUS CARD */}
      <div id="runner-status-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        
        {/* Card Header: Runner Name, Race Name, Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 animate-pulse text-cyan-400" />
              <span>Live Runner Status</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-normal">{race.name}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {race.runnerName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status State Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${statusBadge.bg} flex items-center gap-2 shadow-sm`}>
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot} ${statusBadge.pulse ? 'animate-ping' : ''}`} />
              <span>{liveProgress.runnerStatusLabel}</span>
            </div>

            {/* Progress Count */}
            <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              Checkpoints: <strong className="text-cyan-300">{stats.recordedCheckpointsCount}</strong> / {stats.totalCheckpointsCount}
            </div>
          </div>
        </div>

        {/* Current Position Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                Current Position
              </span>
              <strong className="text-sm sm:text-base font-bold text-slate-100">
                {liveProgress.currentPositionLabel}
              </strong>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-400">
            <span>Last Recorded: </span>
            <strong className="text-slate-200">{liveProgress.lastUpdatedAtFormatted}</strong>
          </div>
        </div>

        {/* Metrics Grid: Distance, Pace, Speed, Last Split */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Distance Covered */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Distance</span>
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-cyan-300 mt-1 truncate">
              {liveProgress.distanceCoveredFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Covered / Total
            </div>
          </div>

          {/* Latest Pace */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>{isFinished ? 'Overall Avg Pace' : 'Latest Pace'}</span>
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-300 mt-1 truncate">
              {liveProgress.latestPaceFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {isFinished ? 'Overall race average' : 'Latest measured pace'}
            </div>
          </div>

          {/* Latest Speed */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>{isFinished ? 'Overall Avg Speed' : 'Latest Speed'}</span>
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-300 mt-1 truncate">
              {liveProgress.latestSpeedFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {isFinished ? 'Overall race average' : 'Latest measured speed'}
            </div>
          </div>

          {/* Last Split Time */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
              <Timer className="w-3 h-3 text-purple-400" />
              <span>Last Split</span>
            </div>
            <div className="text-base sm:text-lg font-mono font-bold text-slate-100 mt-1 truncate">
              {liveProgress.lastSplitTimeFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              {isFinished ? 'Official finish time' : 'Recorded split time'}
            </div>
          </div>

        </div>

      </div>

      {/* 2. NEXT CHECKPOINT & PREDICTED ARRIVAL (When running & not finished) */}
      {isRunning && !isFinished && nextCheckpoint && (
        <div id="next-checkpoint-prediction-card" className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-xl space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
              <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-cyan-300">
                {normalizeCheckpointType(nextCheckpoint.type) === 'finish'
                  ? (currentCheckpointId === nextCheckpoint.id ? 'Your Station • Finish Line Arrival Prediction' : 'Next Event & Predicted Finish')
                  : 'Next Checkpoint & Predicted Arrival'}
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {liveProgress.hasEnoughDataForEta ? 'PREDICTED ARRIVAL' : 'AWAITING SPLIT DATA'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-lg sm:text-xl font-black text-slate-100">
                  {nextCheckpoint.name}
                  {normalizeCheckpointType(nextCheckpoint.type) === 'finish' && ' 🏁'}
                </span>
                {currentCheckpointId === nextCheckpoint.id && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    YOUR STATION
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1.5">
                <span>Total Distance: <strong className="text-slate-200">{formatDistance(nextCheckpoint.distanceMeters, race.displayUnit)}</strong></span>
                <span>•</span>
                <span>
                  Remaining: <strong className="text-cyan-300">
                    {formatDistance(
                      nextCheckpoint.distanceMeters - (lastRecorded ? lastRecorded.cumulativeDistanceMeters : 0),
                      race.displayUnit
                    )}
                  </strong>
                </span>
              </div>
            </div>

            {/* ETA Prediction Output (Arrival Clock Time + Expected Window) */}
            <div className="text-left sm:text-right">
              {liveProgress.hasEnoughDataForEta && nextPrediction ? (
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Estimated Arrival
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-0.5">
                    {nextPrediction.expectedWallClockTimeFormatted}
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-1">
                    Expected Window: <strong className="text-amber-300 font-bold">{nextPrediction.expectedWindowFormatted}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left sm:text-right">
                  <div className="text-xs font-mono font-bold text-amber-300">
                    ETA: Not enough data
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    Awaiting recorded split to calculate ETA
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Pills if prediction available */}
          {liveProgress.hasEnoughDataForEta && nextPrediction && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-cyan-500/20 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                <span className="text-[10px] text-slate-400 uppercase block">
                  {normalizeCheckpointType(nextCheckpoint.type) === 'finish' ? 'Est. Time to Finish' : 'Est. Time to Checkpoint'}
                </span>
                <span className="font-bold text-sm sm:text-base text-slate-100 block mt-0.5">
                  ~{nextPrediction.estimatedSegmentTimeFormatted}
                </span>
                <span className="text-[10px] text-slate-500 block">From current checkpoint</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                <span className="text-[10px] text-slate-400 uppercase block">Expected Window</span>
                <span className="font-bold text-xs sm:text-sm text-cyan-300 block mt-0.5">
                  {nextPrediction.expectedWindowFormatted}
                </span>
                <span className="text-[10px] text-slate-500 block">±5% arrival range</span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                <span className="text-[10px] text-slate-400 uppercase block">Based on Latest Pace</span>
                <span className="font-bold text-sm sm:text-base text-amber-300 block mt-0.5">
                  {nextPrediction.basedOnPaceFormatted}
                </span>
                <span className="text-[10px] text-emerald-400 block font-semibold">{nextPrediction.basedOnSpeedFormatted}</span>
              </div>
            </div>
          )}

          {/* Prediction Disclaimer */}
          <div className="flex items-start gap-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400 pt-1">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Prediction Rule:</strong> Estimated Arrival is calculated dynamically from recorded split performance (
              {nextPrediction ? `${nextPrediction.basedOnPaceFormatted}, ${nextPrediction.basedOnSpeedFormatted}` : 'pace & speed'}
              ). It updates whenever a new official split is recorded.
            </span>
          </div>

        </div>
      )}

      {/* 3. RACE PROGRESS TRACK (Transit/Track Progression) */}
      <div id="race-progress-track" className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Race Progress Track</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Course progression based strictly on recorded authoritative checkpoints
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stats.recordedCheckpointsCount} of {stats.totalCheckpointsCount} Points Completed
          </span>
        </div>

        {/* Visual Progression Course */}
        <div className="space-y-0 relative py-2">
          
          {/* Dynamically Rendered Checkpoints from Race Configuration */}
          {stats.processedCheckpoints.map((row, idx) => {
            const isLast = idx === stats.processedCheckpoints.length - 1;
            const isStart = normalizeCheckpointType(row.checkpoint.type) === 'start' || row.checkpoint.distanceMeters === 0;
            const isFinal = normalizeCheckpointType(row.checkpoint.type) === 'finish' || isLast;
            const hasEvent = row.status === 'RECORDED' && Boolean(row.event);
            const isStartPassed = isStart && (hasEvent || isRunning || isFinished);
            const isStartCurrent = isStart && isRunning && (!lastRecorded || (lastRecordedIndex === 0 && lastRecorded.cumulativeDistanceMeters === 0));
            const isCurrentPos = isStart ? isStartCurrent : (lastRecorded?.checkpoint.id === row.checkpoint.id && isRunning);
            const isNext = nextCheckpoint?.id === row.checkpoint.id && isRunning;
            const isThisStaffScreen = currentCheckpointId === row.checkpoint.id;

            return (
              <div key={row.checkpoint.id} className="relative">
                
                {/* Node Row */}
                <div className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                  isCurrentPos
                    ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : isNext
                    ? 'bg-slate-900 border-cyan-500/30'
                    : (hasEvent || isStartPassed)
                    ? 'bg-slate-950/70 border-slate-800/90'
                    : row.status === 'MISSED'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : isThisStaffScreen
                    ? 'bg-slate-900 border-cyan-500/40'
                    : 'bg-slate-950/40 border-slate-800/50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* Left: Indicator + Name */}
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        {isCurrentPos ? (
                          <div className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-cyan-400/30">
                            ●
                          </div>
                        ) : (hasEvent || isStartPassed) ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                        ) : isNext ? (
                          <div className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-400 flex items-center justify-center font-bold text-xs">
                            ○
                          </div>
                        ) : row.status === 'MISSED' ? (
                          <div className="w-7 h-7 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                            !
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-slate-500 border border-slate-800 flex items-center justify-center font-bold text-xs">
                            ○
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-100 text-xs sm:text-sm">
                            {row.checkpoint.name}
                          </span>

                          {isFinal && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                              FINISH LINE
                            </span>
                          )}

                          {isCurrentPos && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-cyan-400 text-slate-950 animate-pulse">
                              ● CURRENT POSITION
                            </span>
                          )}

                          {isStart && !isRunning && !isFinished && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-950 text-amber-300 border border-amber-500/30">
                              AWAITING START
                            </span>
                          )}

                          {isNext && !isCurrentPos && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                              {isFinal ? '○ NEXT EVENT: FINISH LINE' : '○ NEXT CHECKPOINT'}
                            </span>
                          )}

                          {isThisStaffScreen && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                              YOUR STATION
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>
                            Distance: <strong className="text-slate-300">
                              {isStart ? '0 m' : formatDistance(row.checkpoint.distanceMeters, race.displayUnit)}
                            </strong>
                          </span>
                          {row.event?.staffName && (
                            <>
                              <span>•</span>
                              <span>Staff: <strong className="text-slate-300">{row.event.staffName}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics & Split Status */}
                    <div className="text-left sm:text-right pl-10 sm:pl-0 font-mono text-xs">
                      {isStart ? (
                        isStartPassed ? (
                          <div>
                            <div className="font-bold text-sm sm:text-base text-emerald-400">00:00.000</div>
                            <span className="text-[10px] text-slate-500">Race Start</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">—</span>
                        )
                      ) : hasEvent ? (
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
                      ) : isNext && nextPrediction ? (
                        <div>
                          <div className="text-cyan-300 font-bold text-xs">
                            Est: {nextPrediction.expectedWallClockTimeFormatted}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            ~in {nextPrediction.estimatedSegmentTimeFormatted}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-500 text-[10px] font-bold border border-slate-800">
                          {row.status === 'PENDING' ? 'PENDING' : 'UPCOMING'}
                        </span>
                      )}
                    </div>

                  </div>
                </div>

                {/* Vertical Track Connector (if not final checkpoint) */}
                {!isLast && (
                  <div className="w-7 flex justify-center py-1.5">
                    <div className={`w-0.5 h-6 ${(hasEvent || isStartPassed) ? 'bg-emerald-500/60' : 'bg-slate-800'}`} />
                  </div>
                )}

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};

