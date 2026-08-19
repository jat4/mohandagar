import React, { useState } from 'react';
import { Race, TimingEvent } from '../../types/race';
import { calculateRaceStatistics, formatDistance, formatTimeMs } from '../../utils/raceCalculations';
import { PaceSpeedCharts } from './PaceSpeedCharts';
import { ActivityExportCard } from './ActivityExportCard';
import { 
  Trophy, 
  Timer, 
  Flame, 
  Clock, 
  Gauge, 
  TrendingUp, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  ArrowLeft,
  Calendar,
  User,
  Hash
} from 'lucide-react';

interface RaceActivitySummaryProps {
  race: Race;
  events: TimingEvent[];
  onBackToDashboard: () => void;
  onResetRace?: () => void;
}

export const RaceActivitySummary: React.FC<RaceActivitySummaryProps> = ({
  race,
  events,
  onBackToDashboard,
  onResetRace
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const stats = calculateRaceStatistics(race, events);

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live Dashboard</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {race.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-slate-200">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  {race.runnerName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  Bib #{race.runnerBib}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {stats.dateFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onResetRace && (
            <button
              onClick={() => {
                if (confirm('Reset race timing and clear all recorded splits for a new run?')) {
                  onResetRace();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Race</span>
            </button>
          )}

          <button
            onClick={() => setShowExportModal(!showExportModal)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{showExportModal ? 'Hide Export Card' : 'Export PNG / JPEG'}</span>
          </button>
        </div>
      </div>

      {/* Export Card Toggle Section */}
      {showExportModal && (
        <div className="animate-fadeIn">
          <ActivityExportCard stats={stats} />
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Actual Distance */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Total Distance</div>
          <div className="text-3xl font-mono font-black text-cyan-300">
            {stats.actualDistanceKm.toFixed(2)} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            Planned: {(stats.totalPlannedDistanceMeters / 1000).toFixed(2)} km
          </div>
        </div>

        {/* Total Time */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Finish Time</div>
          <div className="text-3xl font-mono font-black text-slate-100">
            {stats.totalTimeFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Synchronized</span>
          </div>
        </div>

        {/* Average Pace */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Average Pace</div>
          <div className="text-3xl font-mono font-black text-amber-300">
            {stats.averagePaceFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            Minutes per Kilometer
          </div>
        </div>

        {/* Average Speed */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Average Speed</div>
          <div className="text-3xl font-mono font-black text-emerald-300">
            {stats.averageSpeedFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            Kilometers per Hour
          </div>
        </div>

      </div>

      {/* Best & Slowest Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bestSplit ? (
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase mb-1">
                <Flame className="w-4 h-4" />
                <span>Best Split Segment</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {stats.bestSplit.fromCheckpointName} → {stats.bestSplit.toCheckpointName}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Distance: {stats.bestSplit.segmentDistanceKm} km • Time: {formatTimeMs(stats.bestSplit.segmentElapsedMs)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-emerald-300">
                {stats.bestSplit.segmentPaceFormatted}
              </div>
              <div className="text-xs font-mono text-emerald-400">
                {stats.bestSplit.segmentSpeedFormatted}
              </div>
            </div>
          </div>
        ) : null}

        {stats.slowestSplit ? (
          <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase mb-1">
                <Clock className="w-4 h-4" />
                <span>Slowest Split Segment</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {stats.slowestSplit.fromCheckpointName} → {stats.slowestSplit.toCheckpointName}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Distance: {stats.slowestSplit.segmentDistanceKm} km • Time: {formatTimeMs(stats.slowestSplit.segmentElapsedMs)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-rose-300">
                {stats.slowestSplit.segmentPaceFormatted}
              </div>
              <div className="text-xs font-mono text-rose-400">
                {stats.slowestSplit.segmentSpeedFormatted}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Responsive Performance Charts */}
      <PaceSpeedCharts 
        measuredSegments={stats.measuredSegments}
        processedCheckpoints={stats.processedCheckpoints}
      />

      {/* Detailed Splits Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-400" />
              <span>Full Split Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Checkpoint splits, measured segments, segment pace & cumulative progression
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Recorded: <strong className="text-emerald-400">{stats.recordedCheckpointsCount}</strong> • Missed: <strong className="text-amber-400">{stats.missedCheckpointsCount}</strong>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Checkpoint</th>
                <th className="py-3 px-3.5">Dist</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Measured Segment</th>
                <th className="py-3 px-3.5">Segment Dist</th>
                <th className="py-3 px-3.5">Segment Time</th>
                <th className="py-3 px-3.5">Segment Pace</th>
                <th className="py-3 px-3.5">Segment Speed</th>
                <th className="py-3 px-3.5">Cumulative Time</th>
                <th className="py-3 px-3.5">Cumulative Pace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
              {stats.processedCheckpoints.map((row, idx) => (
                <tr 
                  key={row.checkpoint.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.status === 'MISSED' ? 'bg-amber-950/15' : ''
                  }`}
                >
                  <td className="py-3 px-3.5 text-slate-500 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-200">
                    {row.checkpoint.name}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {row.cumulativeDistanceKm.toFixed(2)} km
                  </td>
                  <td className="py-3 px-3.5">
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
                  <td className="py-3 px-3.5 text-slate-300">
                    {row.segment ? (
                      <div>
                        <span>{row.segment.fromCheckpointName} → {row.segment.toCheckpointName}</span>
                        {row.segment.isMultiCheckpointSpan && (
                          <div className="text-[10px] text-amber-400 font-bold">
                            Spans {row.segment.missedCheckpointsCount} Missed Checkpoint(s)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {row.segment ? `${row.segment.segmentDistanceKm.toFixed(2)} km` : '—'}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-cyan-300">
                    {row.segment ? formatTimeMs(row.segment.segmentElapsedMs) : '—'}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-amber-300">
                    {row.segment ? row.segment.segmentPaceFormatted : '—'}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-emerald-300">
                    {row.segment ? row.segment.segmentSpeedFormatted : '—'}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-100">
                    {row.cumulativeElapsedFormatted}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {row.cumulativePaceFormatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
