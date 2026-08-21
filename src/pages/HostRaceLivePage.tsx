/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RaceService } from '../services/raceService';
import { Race, Checkpoint, TimingEvent, StaffSession } from '../types/race';
import { RaceLiveDashboard } from '../components/race/RaceLiveDashboard';
import { QrCodeModal } from '../components/race/QrCodeModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { 
  Timer, 
  ArrowLeft, 
  Layers, 
  Trophy, 
  Activity, 
  AlertCircle, 
  RotateCcw,
  Share2
} from 'lucide-react';

export const HostRaceLivePage: React.FC = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [race, setRace] = useState<Race | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [staffSessions, setStaffSessions] = useState<StaffSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedQrCp, setSelectedQrCp] = useState<Checkpoint | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load and subscribe to race from Firebase using raceId
  useEffect(() => {
    if (!raceId) {
      setError('No race ID specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Initial fetch
    RaceService.getRace(raceId).then((r) => {
      if (!r) {
        setError(`Race "${raceId}" not found in database.`);
      } else {
        setRace(r);
      }
    }).catch((err) => {
      console.error(err);
      setError(err.message || 'Error loading race.');
    }).finally(() => {
      setLoading(false);
    });

    // Real-time race subscription
    const unsubRace = RaceService.subscribeToRace(
      raceId,
      (updated) => {
        if (updated) setRace(updated);
      },
      (err) => console.error('Live race update error:', err)
    );

    // Real-time timing events
    const unsubEvents = RaceService.subscribeToTimingEvents(
      raceId,
      (evts) => setEvents(evts),
      (err) => console.error('Live events error:', err)
    );

    // Real-time staff sessions
    const unsubSessions = RaceService.subscribeToStaffSessions(
      raceId,
      (sessions) => setStaffSessions(sessions)
    );

    return () => {
      unsubRace();
      unsubEvents();
      unsubSessions();
    };
  }, [raceId]);

  const handleStartRace = async () => {
    if (!race) return;
    try {
      await RaceService.startRace(race.id);
      showToast({
        type: 'success',
        title: 'Race Started!',
        message: 'Synchronized start timestamp broadcast to all checkpoints.'
      });
    } catch (err: any) {
      console.error('Failed to start race:', err);
      showToast({
        type: 'error',
        title: 'Start Failed',
        message: err.message || 'Could not start race.'
      });
    }
  };

  const handleFinishRace = async () => {
    if (!race) return;
    try {
      await RaceService.finishRace(race.id);
      showToast({
        type: 'success',
        title: 'Race Finished',
        message: 'Final timing recorded. Activity results ready.'
      });
      navigate(`/host/race/${race.id}/results`);
    } catch (err: any) {
      console.error('Failed to finish race:', err);
      showToast({
        type: 'error',
        title: 'Finish Error',
        message: err.message || 'Could not finish race.'
      });
    }
  };

  const handleResetRace = async () => {
    if (!race) return;
    try {
      await RaceService.resetRace(race.id);
      setShowResetConfirm(false);
      showToast({
        type: 'info',
        title: 'Race Reset',
        message: 'Race state returned to READY. Timing splits cleared.'
      });
    } catch (err: any) {
      console.error('Failed to reset race:', err);
      showToast({
        type: 'error',
        title: 'Reset Error',
        message: err.message || 'Could not reset race.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm">Loading Live Race from Firebase...</span>
        <span className="text-xs text-slate-600">ID: {raceId}</span>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-mono">
        <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error || 'Race not found'}</span>
        </div>
        <Link
          to="/host"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Host Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      
      {/* Sub-Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/host"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Host Overview</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            to={`/host/race/${race.id}/checkpoints`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Checkpoints & QR</span>
          </Link>

          <Link
            to={`/host/race/${race.id}/results`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Results & Export</span>
          </Link>

          {race.status === 'FINISHED' && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Live Controller View */}
      <RaceLiveDashboard
        race={race}
        events={events}
        staffSessions={staffSessions}
        onStartRace={handleStartRace}
        onFinishRace={handleFinishRace}
        onResetRace={() => setShowResetConfirm(true)}
        onOpenQrCode={(cp) => setSelectedQrCp(cp)}
        onTimeCheckpointAsHost={(cp) => navigate(`/checkpoint/${cp.id}?raceId=${race.id}`)}
        onViewSummary={() => navigate(`/host/race/${race.id}/results`)}
      />

      {/* QR Code Modal */}
      {selectedQrCp && (
        <QrCodeModal
          isOpen={Boolean(selectedQrCp)}
          onClose={() => setSelectedQrCp(null)}
          race={race}
          checkpoint={selectedQrCp}
        />
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Race Timings?"
        message="This will reset the race clock to READY status and clear all recorded checkpoint splits. Are you sure you want to proceed?"
        confirmText="Yes, Reset Race"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleResetRace}
        onCancel={() => setShowResetConfirm(false)}
      />

    </div>
  );
};
