/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { Race, Checkpoint, TimingEvent } from '../types/race';
import { CheckpointStaffScreen } from '../components/race/CheckpointStaffScreen';
import { Activity, AlertCircle, ArrowLeft, Timer, QrCode } from 'lucide-react';

export const CheckpointScreenPage: React.FC = () => {
  const { checkpointId } = useParams<{ checkpointId: string }>();
  const [searchParams] = useSearchParams();
  const hintRaceId = searchParams.get('raceId') || undefined;
  const navigate = useNavigate();

  const [race, setRace] = useState<Race | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore staff info from local storage
  const [staffName, setStaffName] = useState(() => {
    return localStorage.getItem('stopwatch_staff_name') || 'Volunteer Staff';
  });
  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem('stopwatch_device_name') || 'Mobile Device';
  });

  useEffect(() => {
    if (!checkpointId) {
      setError('No checkpoint ID specified.');
      setLoading(false);
      return;
    }

    // Check stored session for extra info
    const storedSessionJson = localStorage.getItem(`checkpoint_session_${checkpointId}`);
    let sessionRaceId = hintRaceId;
    if (storedSessionJson) {
      try {
        const parsed = JSON.parse(storedSessionJson);
        if (parsed.raceId) sessionRaceId = parsed.raceId;
        if (parsed.staffName) setStaffName(parsed.staffName);
        if (parsed.deviceName) setDeviceName(parsed.deviceName);
      } catch (e) {
        console.warn('Session parse warning:', e);
      }
    }

    setLoading(true);
    setError(null);

    // Look up race and checkpoint from Firebase
    RaceService.getRaceByCheckpointId(checkpointId, sessionRaceId).then((result) => {
      if (!result) {
        setError(`Checkpoint "${checkpointId}" could not be located in active races.`);
        setLoading(false);
        return;
      }

      setRace(result.race);
      setCheckpoint(result.checkpoint);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setError(err.message || 'Error loading checkpoint from Firebase.');
      setLoading(false);
    });
  }, [checkpointId, hintRaceId]);

  // Subscribe to live race & events once loaded
  useEffect(() => {
    if (!race?.id || !checkpoint?.id) return;

    const unsubRace = RaceService.subscribeToRace(
      race.id,
      (updatedRace) => {
        if (updatedRace) {
          setRace(updatedRace);
          const cp = updatedRace.checkpoints?.find((c) => c.id === checkpoint.id);
          if (cp) setCheckpoint(cp);
        }
      },
      (err) => console.error('Checkpoint race subscription error:', err)
    );

    const unsubEvents = RaceService.subscribeToTimingEvents(
      race.id,
      (evts) => setEvents(evts)
    );

    return () => {
      unsubRace();
      unsubEvents();
    };
  }, [race?.id, checkpoint?.id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-slate-100 font-mono gap-3">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-sm">Connecting to Checkpoint Gate...</span>
        <span className="text-xs text-slate-500">ID: {checkpointId}</span>
      </div>
    );
  }

  if (error || !race || !checkpoint) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto font-mono space-y-4">
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error || 'Checkpoint Gate Not Found'}</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/join"
            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
          >
            Enter Join Code
          </Link>
          <Link
            to="/home"
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <CheckpointStaffScreen
        race={race}
        checkpoint={checkpoint}
        events={events}
        staffName={staffName}
        deviceName={deviceName}
        onExit={() => navigate('/join')}
      />
    </div>
  );
};
