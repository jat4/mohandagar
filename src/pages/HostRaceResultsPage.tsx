/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { Race, TimingEvent } from '../types/race';
import { RaceActivitySummary } from '../components/race/RaceActivitySummary';
import { Activity, AlertCircle, ArrowLeft, Trophy } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const HostRaceResultsPage: React.FC = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [race, setRace] = useState<Race | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId) {
      setError('No race ID specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch single race
    RaceService.getRace(raceId).then((r) => {
      if (!r) {
        setError('Race not found.');
      } else {
        setRace(r);
      }
    }).catch((err) => {
      console.error(err);
      setError(err.message || 'Error loading race results.');
    }).finally(() => {
      setLoading(false);
    });

    // Real-time events subscription
    const unsubEvents = RaceService.subscribeToTimingEvents(
      raceId,
      (evts) => setEvents(evts),
      (err) => console.error(err)
    );

    const unsubRace = RaceService.subscribeToRace(
      raceId,
      (updated) => {
        if (updated) setRace(updated);
      }
    );

    return () => {
      unsubEvents();
      unsubRace();
    };
  }, [raceId]);

  const handleResetRace = async () => {
    if (!race) return;
    try {
      await RaceService.resetRace(race.id);
      showToast({
        type: 'info',
        title: 'Race Reset',
        message: 'Race reset to READY. Timing splits cleared.'
      });
      navigate(`/host/race/${race.id}`);
    } catch (err: any) {
      console.error('Reset error:', err);
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Could not reset race.'
      });
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm">Loading Race Results from Firebase...</span>
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
          to="/host/dashboard"
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
      <RaceActivitySummary
        race={race}
        events={events}
        onBackToDashboard={() => navigate(`/host/race/${race.id}`)}
        onResetRace={handleResetRace}
      />
    </div>
  );
};
