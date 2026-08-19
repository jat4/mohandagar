import React, { useState, useEffect } from 'react';
import { RaceService } from '../../services/raceService';
import { Race, Checkpoint, TimingEvent } from '../../types/race';
import { formatDistance } from '../../utils/raceCalculations';
import { CheckpointStaffScreen } from './CheckpointStaffScreen';
import { 
  KeyRound, 
  ArrowRight, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  User, 
  Flag,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface CheckpointJoinScreenProps {
  initialJoinCode?: string;
  onBackToMain: () => void;
}

export const CheckpointJoinScreen: React.FC<CheckpointJoinScreenProps> = ({
  initialJoinCode = '',
  onBackToMain
}) => {
  const [joinCode, setJoinCode] = useState(initialJoinCode.toUpperCase());
  const [staffName, setStaffName] = useState('');
  const [deviceName, setDeviceName] = useState(() => {
    return navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Tablet / Laptop';
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resolved states
  const [resolvedRace, setResolvedRace] = useState<Race | null>(null);
  const [resolvedCheckpoint, setResolvedCheckpoint] = useState<Checkpoint | null>(null);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [joined, setJoined] = useState(false);

  // If initialJoinCode provided from URL parameter
  useEffect(() => {
    if (initialJoinCode) {
      handleLookup(initialJoinCode);
    }
  }, [initialJoinCode]);

  // Subscribe to live race once resolved
  useEffect(() => {
    if (!resolvedRace?.id) return;

    const unsubRace = RaceService.subscribeToRace(
      resolvedRace.id,
      (updatedRace) => {
        if (updatedRace) {
          setResolvedRace(updatedRace);
          const cp = updatedRace.checkpoints.find((c) => c.id === resolvedCheckpoint?.id);
          if (cp) setResolvedCheckpoint(cp);
        }
      },
      (err) => console.error(err)
    );

    const unsubEvents = RaceService.subscribeToTimingEvents(
      resolvedRace.id,
      (evts) => setEvents(evts)
    );

    return () => {
      unsubRace();
      unsubEvents();
    };
  }, [resolvedRace?.id, resolvedCheckpoint?.id]);

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || joinCode).trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter a join code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const mapping = await RaceService.resolveJoinCode(code);
      if (!mapping || !mapping.active) {
        setErrorMessage('Checkpoint join code is invalid or expired.');
        setLoading(false);
        return;
      }

      const race = await RaceService.getRace(mapping.raceId);
      if (!race) {
        setErrorMessage('Race was not found or has been removed.');
        setLoading(false);
        return;
      }

      const checkpoint = race.checkpoints.find((c) => c.id === mapping.checkpointId);
      if (!checkpoint) {
        setErrorMessage('Assigned checkpoint could not be found in race.');
        setLoading(false);
        return;
      }

      setResolvedRace(race);
      setResolvedCheckpoint(checkpoint);
      if (checkpoint.assignedStaffName && !staffName) {
        setStaffName(checkpoint.assignedStaffName);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error looking up join code.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setErrorMessage('Please provide your name to identify your device on the race board.');
      return;
    }
    setJoined(true);
  };

  if (joined && resolvedRace && resolvedCheckpoint) {
    return (
      <CheckpointStaffScreen
        race={resolvedRace}
        checkpoint={resolvedCheckpoint}
        events={events}
        staffName={staffName.trim()}
        deviceName={deviceName.trim() || 'Staff Phone'}
        onExit={() => setJoined(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Back Button */}
        <button
          onClick={onBackToMain}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Join Checkpoint
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Connect your device to time a race split
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="my-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Code Entry */}
        {!resolvedCheckpoint ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="space-y-4 mt-6"
          >
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Checkpoint Join Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 8K4P-29"
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xl font-bold tracking-wider placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
                />
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-1.5">
                The 6-character code provided on the Host Dashboard or printed card.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Validating Code...' : 'Find Checkpoint'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: Confirm Staff Info & Connect */
          <form onSubmit={handleConfirmJoin} className="space-y-4 mt-5 animate-fadeIn">
            
            {/* Checkpoint Details Card */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-left">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-1 font-bold">
                <span>VERIFIED CHECKPOINT</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-slate-100">
                {resolvedCheckpoint.name}
              </div>
              <div className="text-xs font-mono text-slate-300 mt-0.5">
                Distance: <strong>{formatDistance(resolvedCheckpoint.distanceMeters, resolvedRace?.displayUnit)}</strong>
              </div>
              <div className="mt-2 pt-2 border-t border-cyan-900/60 text-xs font-mono text-slate-400">
                Race: <strong className="text-slate-200">{resolvedRace?.name}</strong> • Runner: <strong className="text-slate-200">{resolvedRace?.runnerName}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Your Name / Role *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Device Identifier (Optional)
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro - Turn 3"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setResolvedCheckpoint(null);
                  setResolvedRace(null);
                }}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Enter Timing Screen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
