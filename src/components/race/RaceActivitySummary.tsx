import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Race, TimingEvent, PublishedResult, PublicationStatus } from '../../types/race';
import { calculateRaceStatistics, formatDistance, formatTimeMs } from '../../utils/raceCalculations';
import { PaceSpeedCharts } from './PaceSpeedCharts';
import { downloadRaceCertificatePdf } from '../../services/pdfCertificateService';
import { ResultQrCodeModal } from './ResultQrCodeModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { RaceService } from '../../services/raceService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Trophy, 
  Timer, 
  Flame, 
  Clock, 
  Gauge, 
  TrendingUp, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  ArrowLeft,
  Calendar,
  User,
  Globe,
  Eye,
  Trash2,
  Send,
  Copy,
  ExternalLink,
  Lock,
  QrCode,
  Award
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
  const { currentUser, isHost } = useAuth();
  const { showToast } = useToast();

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResultQrModal, setShowResultQrModal] = useState(false);

  const [publishedResult, setPublishedResult] = useState<PublishedResult | null>(null);
  const [publishingAction, setPublishingAction] = useState(false);

  const stats = calculateRaceStatistics(race, events);
  const isRaceOwner = currentUser && (currentUser.uid === race.hostUid);

  const handleDownloadCertificate = async () => {
    setDownloadingPdf(true);
    try {
      await downloadRaceCertificatePdf(stats, { raceId: race.id });
      showToast({
        type: 'success',
        title: 'Certificate Downloaded',
        message: 'Official race result PDF certificate saved successfully.'
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

  // Subscribe to live published status for this race
  useEffect(() => {
    const unsub = RaceService.subscribeToPublishedResult(
      race.id,
      (res) => {
        setPublishedResult(res);
      },
      (err) => console.warn('Published result status check:', err)
    );
    return () => unsub();
  }, [race.id]);

  const currentStatus: PublicationStatus = publishedResult 
    ? publishedResult.resultStatus 
    : 'UNPUBLISHED';

  const handlePublish = async () => {
    setPublishingAction(true);
    try {
      const res = await RaceService.publishRaceResult(race, events);
      setPublishedResult(res);
      showToast({
        type: 'success',
        title: 'Result Published!',
        message: 'Official race results are now live and publicly viewable.'
      });
      setShowPublishConfirm(false);
    } catch (err: any) {
      console.error('Publish error:', err);
      showToast({
        type: 'error',
        title: 'Publish Failed',
        message: err.message || 'Could not publish race result.'
      });
    } finally {
      setPublishingAction(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishingAction(true);
    try {
      await RaceService.unpublishRaceResult(race.id);
      showToast({
        type: 'info',
        title: 'Result Unpublished',
        message: 'Official result removed from public directory.'
      });
      setShowUnpublishConfirm(false);
    } catch (err: any) {
      console.error('Unpublish error:', err);
      showToast({
        type: 'error',
        title: 'Unpublish Failed',
        message: err.message || 'Could not unpublish race result.'
      });
    } finally {
      setPublishingAction(false);
    }
  };

  const handleDeleteResult = async () => {
    setPublishingAction(true);
    try {
      await RaceService.deleteRaceResult(race.id);
      showToast({
        type: 'info',
        title: 'Result Permanently Deleted',
        message: 'Published result permanently removed from Firebase public directory.'
      });
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Delete result error:', err);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete race result.'
      });
    } finally {
      setPublishingAction(false);
    }
  };

  const handleCopyPublicUrl = () => {
    const domain = window.location.origin.includes('localhost') 
      ? window.location.origin 
      : 'https://mohandagar.in';
    const url = `${domain}/results/${race.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast({
        type: 'info',
        title: 'Link Copied',
        message: 'Public official result link copied to clipboard.'
      });
    }).catch(console.error);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl shadow-xl">
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
                <span className="flex items-center gap-1 text-slate-200 font-bold">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  {race.runnerName}
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
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Race</span>
            </button>
          )}

          <button
            id="btn-download-certificate"
            onClick={handleDownloadCertificate}
            disabled={downloadingPdf}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? 'Generating PDF...' : 'Download Certificate'}</span>
          </button>
        </div>
      </div>

      {/* Host Result Management Banner */}
      {isRaceOwner && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-slate-800 text-slate-300">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">Public Race Result Status</h3>
                  
                  {/* Status Badge */}
                  {currentStatus === 'PUBLISHED' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300 flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>PUBLISHED</span>
                    </span>
                  ) : currentStatus === 'DELETED' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 border border-rose-500/50 text-rose-300 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>DELETED</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>UNPUBLISHED</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  {currentStatus === 'PUBLISHED'
                    ? 'This result snapshot is live on the public directory and accessible to spectators at /results/' + race.id
                    : currentStatus === 'DELETED'
                    ? 'This result snapshot was marked as deleted and is hidden from public lists.'
                    : 'This race result is currently private to the host. Publish it to create an official public link and QR code.'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {currentStatus === 'UNPUBLISHED' && (
                <button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={publishingAction || race.status !== 'FINISHED'}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>PUBLISH RESULT</span>
                </button>
              )}

              {currentStatus === 'PUBLISHED' && (
                <>
                  <Link
                    to={`/results/${race.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VIEW PUBLIC RESULT</span>
                  </Link>

                  <button
                    onClick={handleCopyPublicUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>COPY LINK</span>
                  </button>

                  {publishedResult && (
                    <button
                      onClick={() => setShowResultQrModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>QR CODE</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowUnpublishConfirm(true)}
                    disabled={publishingAction}
                    className="px-4 py-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>UNPUBLISH</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={publishingAction}
                    className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-mono text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE RESULT</span>
                  </button>
                </>
              )}

              {currentStatus === 'DELETED' && (
                <button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={publishingAction}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>RE-PUBLISH RESULT</span>
                </button>
              )}
            </div>
          </div>

          {currentStatus === 'PUBLISHED' && (
            <div className="flex items-center justify-between text-xs font-mono bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-500">Public URL:</span>
                <span className="text-cyan-300 truncate">https://mohandagar.in/results/{race.id}</span>
              </div>
              <button
                onClick={handleCopyPublicUrl}
                className="text-cyan-400 hover:underline shrink-0 ml-2 font-bold"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showPublishConfirm}
        title="Publish Race Result to Public Directory?"
        message="This will create an official, publicly accessible result document with full checkpoint splits, pace calculations, and analytics at https://mohandagar.in/results/${race.id}. Spectators and athletes will be able to view and share this official record."
        confirmText="Publish Result"
        cancelText="Cancel"
        variant="info"
        onConfirm={handlePublish}
        onCancel={() => setShowPublishConfirm(false)}
      />

      <ConfirmModal
        isOpen={showUnpublishConfirm}
        title="Unpublish Race Result?"
        message="This will hide the race results from the public directory. The direct link will no longer show public splits until re-published."
        confirmText="Unpublish"
        cancelText="Cancel"
        variant="warning"
        onConfirm={handleUnpublish}
        onCancel={() => setShowUnpublishConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Published Race Result?"
        message="Are you sure you want to permanently delete this published result record from Firestore? The result will be immediately removed from the public directory."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteResult}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Race Timings?"
        message="This will reset the race clock to READY status and clear all recorded checkpoint splits. Are you sure you want to proceed?"
        confirmText="Reset Race"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          setShowResetConfirm(false);
          if (onResetRace) onResetRace();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Result QR Modal */}
      {publishedResult && (
        <ResultQrCodeModal
          isOpen={showResultQrModal}
          onClose={() => setShowResultQrModal(false)}
          result={publishedResult}
        />
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
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

        {/* Desktop Table Layout (visible on md screens and above) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
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

        {/* Mobile Compact Checkpoint Cards (visible on screens below md / 768px) */}
        <div className="block md:hidden space-y-3.5">
          {stats.processedCheckpoints.map((row, idx) => (
            <div
              key={row.checkpoint.id}
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
                      : `${row.cumulativeDistanceKm.toFixed(2)} km`}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/50">
                  <div className="text-[10px] uppercase text-slate-400">Segment Dist</div>
                  <div className="text-slate-200 font-bold mt-0.5">
                    {row.segment ? `${row.segment.segmentDistanceKm.toFixed(2)} km` : '—'}
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

    </div>
  );
};
