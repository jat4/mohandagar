import React, { useRef, useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { 
  Download, 
  Image as ImageIcon, 
  Sparkles, 
  Trophy, 
  Zap, 
  Clock, 
  Flame, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { RaceStatistics } from '../../types/race';
import { formatTimeMs } from '../../utils/raceCalculations';

interface ActivityExportCardProps {
  stats: RaceStatistics;
  customTitle?: string;
  isStaffSpecific?: boolean;
  staffCheckpointName?: string;
}

export const ActivityExportCard: React.FC<ActivityExportCardProps> = ({
  stats,
  customTitle,
  isStaffSpecific,
  staffCheckpointName
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  const handleExport = async (format: 'png' | 'jpeg') => {
    if (!cardRef.current) return;
    setExporting(true);
    setExportFormat(format);

    try {
      // Allow DOM to settle for rendering
      await new Promise((res) => setTimeout(res, 150));

      const dataUrl = format === 'png'
        ? await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true })
        : await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });

      const link = document.createElement('a');
      const filename = `${stats.raceName.replace(/[^a-z0-9]/gi, '_')}_${stats.runnerName.replace(/[^a-z0-9]/gi, '_')}_activity.${format}`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-slate-100 font-mono">
            {isStaffSpecific ? `Export Checkpoint Result (${staffCheckpointName})` : 'Export Official Activity Card'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('png')}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting && exportFormat === 'png' ? 'Generating...' : 'Export PNG'}</span>
          </button>

          <button
            onClick={() => handleExport('jpeg')}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting && exportFormat === 'jpeg' ? 'Generating...' : 'Export JPEG'}</span>
          </button>
        </div>
      </div>

      {/* Renderable Activity Card (Captured by html-to-image) */}
      <div
        ref={cardRef}
        className="bg-slate-950 border border-slate-800 rounded-2xl p-7 text-slate-100 shadow-2xl relative overflow-hidden max-w-4xl mx-auto"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Accent Glow Backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex items-start justify-between border-b border-slate-800 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-1">
              <Trophy className="w-4 h-4" />
              <span>{customTitle || 'Multi-Checkpoint Official Race Summary'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              {stats.raceName}
            </h2>
            <div className="text-sm text-slate-400 font-mono mt-1">
              Runner: <strong className="text-slate-100">{stats.runnerName}</strong> • Date: <span className="text-slate-300">{stats.dateFormatted}</span>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              ● OFFICIAL RESULT
            </span>
          </div>
        </div>

        {/* Primary Metric Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Total Distance</div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-cyan-300">
              {stats.actualDistanceKm.toFixed(2)} <span className="text-sm font-normal text-slate-400">km</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">
              Planned: {(stats.totalPlannedDistanceMeters / 1000).toFixed(2)} km
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Total Time</div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-slate-100">
              {stats.totalTimeFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">Authoritative Synchronized</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Average Pace</div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-amber-300">
              {stats.averagePaceFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">Overall Course</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">Average Speed</div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-300">
              {stats.averageSpeedFormatted}
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">Kilometers per Hour</div>
          </div>
        </div>

        {/* Best & Slowest Split Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {stats.bestSplit ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold uppercase mb-0.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Best Measured Split</span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {stats.bestSplit.fromCheckpointName} → {stats.bestSplit.toCheckpointName}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Dist: {stats.bestSplit.segmentDistanceKm} km • Time: {stats.bestSplit.segmentPaceFormatted}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-black text-emerald-300">
                  {stats.bestSplit.segmentPaceFormatted}
                </div>
                <div className="text-[11px] font-mono text-emerald-400/80">
                  {stats.bestSplit.segmentSpeedFormatted}
                </div>
              </div>
            </div>
          ) : null}

          {stats.slowestSplit ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-bold uppercase mb-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Slowest Measured Split</span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {stats.slowestSplit.fromCheckpointName} → {stats.slowestSplit.toCheckpointName}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Dist: {stats.slowestSplit.segmentDistanceKm} km • Time: {stats.slowestSplit.segmentPaceFormatted}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-mono font-black text-rose-300">
                  {stats.slowestSplit.segmentPaceFormatted}
                </div>
                <div className="text-[11px] font-mono text-rose-400/80">
                  {stats.slowestSplit.segmentSpeedFormatted}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Split Table */}
        <div className="relative z-10 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Checkpoint</th>
                <th className="py-2.5 px-3">Dist</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Measured Segment</th>
                <th className="py-2.5 px-3">Split Time</th>
                <th className="py-2.5 px-3">Segment Pace</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Cumulative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
              {stats.processedCheckpoints.map((row) => (
                <tr key={row.checkpoint.id} className={row.status === 'MISSED' ? 'bg-amber-950/20' : ''}>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {row.checkpoint.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {row.cumulativeDistanceKm} km
                  </td>
                  <td className="py-2.5 px-3">
                    {row.status === 'RECORDED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                        RECORDED
                      </span>
                    ) : row.status === 'MISSED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-500/40 text-amber-300">
                        MISSED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                        {row.status}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {row.segment ? (
                      <span>
                        {row.segment.fromCheckpointName} → {row.segment.toCheckpointName}
                        {row.segment.isMultiCheckpointSpan && (
                          <span className="text-amber-400 text-[10px] ml-1">
                            ({row.segment.segmentDistanceKm}km Span)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-cyan-300">
                    {row.segment ? formatTimeMs(row.segment.segmentElapsedMs) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-amber-300">
                    {row.segment ? row.segment.segmentPaceFormatted : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-300">
                    {row.segment ? row.segment.segmentSpeedFormatted : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">
                    {row.cumulativeElapsedFormatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info stamp */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div>Timing System: Multi-Checkpoint Authoritative Cloud Timer</div>
          <div>Verified at mohandagar.in</div>
        </div>

      </div>
    </div>
  );
};
