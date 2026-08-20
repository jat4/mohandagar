/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { Race, TimingEvent } from '../types/race';
import { RaceActivitySummary } from '../components/race/RaceActivitySummary';
import { Activity, AlertCircle, ArrowLeft, Trophy, Home } from 'lucide-react';

export const ActivityResultPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  const [race, setRace] = useState<Race | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) {
      setError('No activity ID specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Activity ID is the race ID in our authoritative data model
    RaceService.getRace(activityId).then((r) => {
      if (!r) {
        setError(`Activity record "${activityId}" was not found.`);
      } else {
        setRace(r);
      }
    }).catch((err) => {
      console.error(err);
      setError(err.message || 'Error loading activity from Firebase.');
    }).finally(() => {
      setLoading(false);
    });

    const unsubEvents = RaceService.subscribeToTimingEvents(
      activityId,
      (evts) => setEvents(evts)
    );

    return () => unsubEvents();
  }, [activityId]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center font-mono text-slate-400 gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm">Loading Activity Record from Cloud...</span>
        <span className="text-xs text-slate-600">ID: {activityId}</span>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 font-mono">
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error || 'Activity Record Not Found'}</span>
        </div>
        <Link
          to="/home"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      <RaceActivitySummary
        race={race}
        events={events}
        onBackToDashboard={() => navigate('/home')}
      />
    </div>
  );
};
