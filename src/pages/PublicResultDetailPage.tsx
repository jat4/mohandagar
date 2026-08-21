/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { PublishedResult, RaceStatistics } from '../types/race';
import { PaceSpeedCharts } from '../components/race/PaceSpeedCharts';
import { downloadRaceCertificatePdf } from '../services/pdfCertificateService';
import { ResultQrCodeModal } from '../components/race/ResultQrCodeModal';
import { 
  Trophy, 
  User, 
  Calendar, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Timer, 
  Activity, 
  AlertCircle, 
  QrCode, 
  Award,
  Download,
  AlertTriangle
} from 'lucide-react';
import { formatTimeMs } from '../utils/raceCalculations';
import { useToast } from '../context/ToastContext';

export const PublicResultDetailPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [result, setResult] = useState<PublishedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!resultId) {
      setError('No result ID specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = RaceService.subscribeToPublishedResult(
      resultId,
      (data) => {
        if (!data || data.resultStatus !== 'PUBLISHED') {
          setError('This race result is not published or has been removed.');
          setResult(null);
        } else {
          setResult(data);
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching published result:', err);
        setError('Error loading published race result.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [resultId]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast({
        type: 'info',
        title: 'Link Copied',
        message: 'Direct official result link copied to clipboard.'
      });
    }).catch(console.error);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm">Loading official race results...</span>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-mono">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
          <div className="font-bold text-slate-100">{error || 'Result not available'}</div>
          <p className="text-slate-400 text-[11px]">
            The race result you are looking for may not be published yet, or may have been unpublished by the race director.
          </p>
        </div>
        <Link
          to="/results"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Public Results</span>
        </Link>
      </div>
    );
  }

  // Convert PublishedResult to RaceStatistics interface for existing ActivityExportCard & charts
  const statsForExport: RaceStatistics = {
    raceName: result.raceName,
    runnerName: result.runnerName,
    dateFormatted: result.dateFormatted,
    status: 'FINISHED',
    totalPlannedDistanceMeters: result.totalPlannedDistanceMeters,
    actualDistanceMeters: result.actualDistanceMeters,
    actualDistanceKm: result.actualDistanceKm,
    totalTimeMs: result.totalTimeMs,
    totalTimeFormatted: result.totalTimeFormatted,
    averagePaceSecondsPerKm: result.averagePaceSecondsPerKm,
    averagePaceFormatted: result.averagePaceFormatted,
    averageSpeedKmh: result.averageSpeedKmh,
    averageSpeedFormatted: result.averageSpeedFormatted,
    bestSplit: result.bestSplit,
    slowestSplit: result.slowestSplit,
    processedCheckpoints: result.processedCheckpoints || [],
    measuredSegments: result.measuredSegments || [],
    missedCheckpointsCount: result.missedCheckpointsCount || 0,
    recordedCheckpointsCount: result.recordedCheckpointsCount || 0,
    totalCheckpointsCount: result.totalCheckpointsCount || 0
  };

  const handleDownloadCertificate = async () => {
    setDownloadingPdf(true);
    try {
      await downloadRaceCertificatePdf(statsForExport, {
        raceId: result.id,
        hostName: result.hostName
      });
      showToast({
        type: 'success',
        title: 'Certificate Downloaded',
        message: 'Official race certificate PDF saved successfully.'
      });
    } catch (err: any) {
      console.error('PDF download error:', err);
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Failed to generate race certificate PDF.'
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <Link
            to="/results"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 mb-3 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Public Results</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                  {result.raceName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>OFFICIAL</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-slate-200 font-bold">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  {result.runnerName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {result.dateFormatted}
                </span>
                {result.hostName && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">Host: {result.hostName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowQrModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>QR & Share</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-300" />
            <span>Copy Link</span>
          </button>

          <button
            id="btn-download-public-certificate"
            onClick={handleDownloadCertificate}
            disabled={downloadingPdf}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Certificate'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Actual Distance */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Official Distance</div>
          <div className="text-3xl font-mono font-black text-cyan-300">
            {result.actualDistanceKm?.toFixed(2)} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            Planned: {((result.totalPlannedDistanceMeters || 0) / 1000).toFixed(2)} km
          </div>
        </div>

        {/* Total Time */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Finish Time</div>
          <div className="text-3xl font-mono font-black text-slate-100">
            {result.totalTimeFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud Synchronized</span>
          </div>
        </div>

        {/* Average Pace */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Average Pace</div>
          <div className="text-3xl font-mono font-black text-amber-300">
            {result.averagePaceFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            Minutes per Kilometer
          </div>
        </div>

        {/* Average Speed */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">Average Speed</div>
          <div className="text-3xl font-mono font-black text-emerald-300">
            {result.averageSpeedFormatted}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-2">
            Kilometers per Hour
          </div>
        </div>
      </div>

      {/* Best & Slowest Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result.bestSplit ? (
          <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase mb-1">
                <Flame className="w-4 h-4" />
                <span>Best Split Segment</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {result.bestSplit.fromCheckpointName} → {result.bestSplit.toCheckpointName}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Distance: {result.bestSplit.segmentDistanceKm} km • Time: {formatTimeMs(result.bestSplit.segmentElapsedMs)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-emerald-300">
                {result.bestSplit.segmentPaceFormatted}
              </div>
              <div className="text-xs font-mono text-emerald-400">
                {result.bestSplit.segmentSpeedFormatted}
              </div>
            </div>
          </div>
        ) : null}

        {result.slowestSplit ? (
          <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase mb-1">
                <Clock className="w-4 h-4" />
                <span>Slowest Split Segment</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {result.slowestSplit.fromCheckpointName} → {result.slowestSplit.toCheckpointName}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Distance: {result.slowestSplit.segmentDistanceKm} km • Time: {formatTimeMs(result.slowestSplit.segmentElapsedMs)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-black text-rose-300">
                {result.slowestSplit.segmentPaceFormatted}
              </div>
              <div className="text-xs font-mono text-rose-400">
                {result.slowestSplit.segmentSpeedFormatted}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Interactive Charts */}
      {result.measuredSegments && result.measuredSegments.length > 0 && (
        <PaceSpeedCharts 
          measuredSegments={result.measuredSegments}
          processedCheckpoints={result.processedCheckpoints || []}
        />
      )}

      {/* Detailed Checkpoint Splits Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-400" />
              <span>Official Checkpoint Split Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Multi-checkpoint recorded split gates, pace dynamics & cumulative progression
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Recorded: <strong className="text-emerald-400">{result.recordedCheckpointsCount || 0}</strong> • Missed: <strong className="text-amber-400">{result.missedCheckpointsCount || 0}</strong>
          </div>
        </div>

        {/* Desktop Table Layout (visible on md screens and above) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800">
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
              {result.processedCheckpoints?.map((row, idx) => (
                <tr 
                  key={row.checkpoint.id || idx}
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
                    {row.cumulativeDistanceKm?.toFixed(2)} km
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
                    {row.segment ? `${row.segment.segmentDistanceKm?.toFixed(2)} km` : '—'}
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
                    {row.cumulativeElapsedFormatted || '—'}
                  </td>
                  <td className="py-3 px-3.5 text-slate-400">
                    {row.cumulativePaceFormatted || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Compact Checkpoint Cards (visible on screens below md / 768px) */}
        <div className="block md:hidden space-y-3.5">
          {result.processedCheckpoints?.map((row, idx) => (
            <div
              key={row.checkpoint.id || idx}
              className={`p-4 rounded-2xl border ${
                row.status === 'MISSED'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-slate-950/80 border-slate-800'
              } space-y-3 shadow-md`}
            >
              {/* Checkpoint Header: Order, Name, and Status Badge */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-100 break-words">
                    {row.checkpoint.name}
                  </span>
                </div>

                <div>
                  {row.status === 'RECORDED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 inline-flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>RECORDED</span>
                    </span>
                  ) : row.status === 'MISSED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/90 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>MISSED</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 shrink-0">
                      {row.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Measured Segment Details */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/70 text-xs font-mono space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Segment:</span>
                  <span className="text-slate-200 font-bold text-right break-words">
                    {row.segment ? `${row.segment.fromCheckpointName} → ${row.segment.toCheckpointName}` : '—'}
                  </span>
                </div>
                {row.segment?.isMultiCheckpointSpan && (
                  <div className="text-[10px] text-amber-400 font-bold text-right">
                    Spans {row.segment.missedCheckpointsCount} Missed Checkpoint(s)
                  </div>
                )}
              </div>

              {/* Grid of Key Split Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Distance</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {row.cumulativeDistanceKm < 1 && (row.cumulativeDistanceMeters || 0) > 0
                      ? `${row.cumulativeDistanceMeters} m`
                      : `${row.cumulativeDistanceKm?.toFixed(2)} km`}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Segment Dist</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {row.segment ? `${row.segment.segmentDistanceKm?.toFixed(2)} km` : '—'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Segment Time</div>
                  <div className="text-cyan-300 font-bold mt-0.5">
                    {row.segment ? formatTimeMs(row.segment.segmentElapsedMs) : '—'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Segment Pace</div>
                  <div className="text-amber-300 font-bold mt-0.5">
                    {row.segment ? row.segment.segmentPaceFormatted : '—'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Segment Speed</div>
                  <div className="text-emerald-300 font-bold mt-0.5">
                    {row.segment ? row.segment.segmentSpeedFormatted : '—'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Cumulative Time</div>
                  <div className="text-slate-100 font-bold mt-0.5">
                    {row.cumulativeElapsedFormatted || '—'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50 col-span-2">
                  <div className="text-[10px] uppercase text-slate-400">Cumulative Pace</div>
                  <div className="text-slate-300 font-bold mt-0.5">
                    {row.cumulativePaceFormatted || '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <ResultQrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          result={result}
        />
      )}

    </div>
  );
};
