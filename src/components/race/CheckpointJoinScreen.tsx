/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RaceService } from '../../services/raceService';
import { auth } from '../../lib/firebase';
import { Race, Checkpoint, TimingEvent, StaffSession, normalizeCheckpointType, getActiveCheckpointAssignment, getCheckpointRoleInfo, formatCleanErrorMessage } from '../../types/race';
import { formatDistance } from '../../utils/raceCalculations';
import { CheckpointStaffScreen } from './CheckpointStaffScreen';
import { CameraQrScanner } from './CameraQrScanner';
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
  ArrowLeft,
  Camera,
  Keyboard,
  ShieldCheck
} from 'lucide-react';

interface CheckpointJoinScreenProps {
  initialJoinCode?: string;
  initialStaffParams?: {
    raceId: string;
    checkpointId: string;
    joinCode?: string;
    staffName?: string;
  };
  onBackToMain: () => void;
  onJoinedStaff?: (info: { raceId: string; checkpointId: string; joinCode?: string; staffName: string }) => void;
}

export const CheckpointJoinScreen: React.FC<CheckpointJoinScreenProps> = ({
  initialJoinCode = '',
  initialStaffParams,
  onBackToMain,
  onJoinedStaff
}) => {
  const navigate = useNavigate();
  const [joinMethod, setJoinMethod] = useState<'QR' | 'MANUAL'>(() => {
    return initialJoinCode ? 'MANUAL' : 'QR';
  });

  const [joinCode, setJoinCode] = useState(initialJoinCode.toUpperCase());
  const [staffName, setStaffName] = useState(initialStaffParams?.staffName || '');
  const [deviceName, setDeviceName] = useState(() => {
    return navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Tablet / Laptop';
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resolved states
  const [resolvedRace, setResolvedRace] = useState<Race | null>(null);
  const [resolvedCheckpoint, setResolvedCheckpoint] = useState<Checkpoint | null>(null);
  const [staffSessions, setStaffSessions] = useState<StaffSession[]>([]);
  const [events, setEvents] = useState<TimingEvent[]>([]);
  const [joined, setJoined] = useState(Boolean(initialStaffParams?.raceId && initialStaffParams?.checkpointId));

  // If direct staff params are provided from route
  useEffect(() => {
    if (initialStaffParams?.raceId && initialStaffParams?.checkpointId) {
      setLoading(true);
      RaceService.getRace(initialStaffParams.raceId).then((race) => {
        if (race) {
          const cp = race.checkpoints.find((c) => c.id === initialStaffParams.checkpointId);
          if (cp) {
            setResolvedRace(race);
            setResolvedCheckpoint(cp);
            setJoined(true);
            if (initialStaffParams.staffName) {
              setStaffName(initialStaffParams.staffName);
            }
          }
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [initialStaffParams?.raceId, initialStaffParams?.checkpointId]);

  // If initialJoinCode provided from URL parameter
  useEffect(() => {
    if (initialJoinCode && !initialStaffParams?.raceId) {
      setJoinCode(initialJoinCode.toUpperCase());
      setJoinMethod('MANUAL');
      handleLookup(initialJoinCode);
    }
  }, [initialJoinCode]);

  // Subscribe to live race and staff sessions once resolved
  useEffect(() => {
    if (!resolvedRace?.id) return;

    const unsubRace = RaceService.subscribeToRace(
      resolvedRace.id,
      (updatedRace) => {
        if (updatedRace) {
          setResolvedRace({ ...updatedRace });
          const cp = updatedRace.checkpoints.find((c) => c.id === resolvedCheckpoint?.id);
          if (cp) setResolvedCheckpoint({ ...cp });
        }
      },
      (err) => console.error(err)
    );

    const unsubSessions = RaceService.subscribeToStaffSessions(
      resolvedRace.id,
      (sessions) => {
        setStaffSessions(sessions);
      }
    );

    const unsubEvents = RaceService.subscribeToTimingEvents(
      resolvedRace.id,
      (evts) => setEvents([...evts])
    );

    return () => {
      unsubRace();
      unsubSessions();
      unsubEvents();
    };
  }, [resolvedRace?.id, resolvedCheckpoint?.id]);

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || joinCode).trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please enter or scan a join code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const mapping = await RaceService.resolveJoinCode(code);
      if (!mapping || !mapping.active) {
        setErrorMessage('Checkpoint QR is invalid or expired.');
        setLoading(false);
        return;
      }

      const race = await RaceService.getRace(mapping.raceId);
      if (!race) {
        setErrorMessage('Checkpoint QR is invalid or expired.');
        setLoading(false);
        return;
      }

      const checkpoint = race.checkpoints.find((c) => c.id === mapping.checkpointId);
      if (!checkpoint) {
        setErrorMessage('Checkpoint QR is invalid or expired.');
        setLoading(false);
        return;
      }

      setResolvedRace(race);
      setResolvedCheckpoint(checkpoint);
      setJoinCode(code);
      if (!staffName) {
        setStaffName(localStorage.getItem('stopwatch_staff_name') || 'Volunteer Staff');
      }
    } catch (err: any) {
      setErrorMessage(formatCleanErrorMessage(err, 'Error looking up join code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQrScanned = (scannedText: string) => {
    let cleanCode = scannedText.trim();
    // Support URLs like https://mohandagar.in/#/join/8K4P-29
    if (cleanCode.includes('/join/')) {
      cleanCode = cleanCode.split('/join/')[1].split('?')[0].split('/')[0];
    }
    setJoinCode(cleanCode.toUpperCase());
    handleLookup(cleanCode);
  };

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setErrorMessage('Please provide your name to identify your device on the race board.');
      return;
    }
    if (resolvedRace && resolvedCheckpoint) {
      // Check if occupied by another user
      const activeAssignment = getActiveCheckpointAssignment(resolvedCheckpoint, staffSessions);
      const currentUserName = staffName.trim();
      const currentUid = auth.currentUser?.uid;

      const isSameUser = Boolean(
        (currentUid && resolvedCheckpoint.assignedStaffUid && currentUid === resolvedCheckpoint.assignedStaffUid) ||
        (currentUserName && activeAssignment.staffName && currentUserName.toLowerCase() === activeAssignment.staffName.toLowerCase()) ||
        (resolvedCheckpoint.isHostAssigned && currentUid === resolvedRace.hostUid)
      );

      if (activeAssignment.isOccupied && !isSameUser) {
        setErrorMessage(`CHECKPOINT ALREADY OCCUPIED: Checkpoint ${resolvedCheckpoint.name} is currently assigned to ${activeAssignment.staffName}. You cannot join this checkpoint until the current staff member leaves.`);
        return;
      }

      try {
        await RaceService.claimCheckpoint({
          raceId: resolvedRace.id,
          checkpointId: resolvedCheckpoint.id,
          staffName: staffName.trim(),
          deviceName: deviceName.trim() || 'Staff Device'
        });
        setJoined(true);
        if (onJoinedStaff && resolvedRace && resolvedCheckpoint) {
          onJoinedStaff({
            raceId: resolvedRace.id,
            checkpointId: resolvedCheckpoint.id,
            joinCode: joinCode.trim() || undefined,
            staffName: staffName.trim()
          });
        }
      } catch (err: any) {
        console.error('Could not claim checkpoint on join:', err);
        setErrorMessage(formatCleanErrorMessage(err, 'Checkpoint already assigned.'));
        return;
      }
    }
  };

  if (joined && resolvedRace && resolvedCheckpoint) {
    return (
      <CheckpointStaffScreen
        race={resolvedRace}
        checkpoint={resolvedCheckpoint}
        events={events}
        staffName={staffName.trim()}
        deviceName={deviceName.trim() || 'Staff Phone'}
        onBack={() => {
          onBackToMain();
        }}
        onLeave={() => {
          setJoined(false);
          setResolvedCheckpoint(null);
          setResolvedRace(null);
          onBackToMain();
        }}
        onViewResult={() => navigate(`/activity/${resolvedRace.id}`)}
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
          <span>Back to Host Screen</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Checkpoint Join
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Scan QR code or enter join code manually
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="my-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Scan QR or Manual Code Entry */}
        {!resolvedCheckpoint ? (
          <div className="mt-5 space-y-4">
            
            {/* Join Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setJoinMethod('QR')}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  joinMethod === 'QR'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setJoinMethod('MANUAL')}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  joinMethod === 'MANUAL'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Enter Code</span>
              </button>
            </div>

            {/* View A: Live Camera QR Scanner */}
            {joinMethod === 'QR' && (
              <div className="space-y-3 animate-fadeIn">
                <CameraQrScanner onScanSuccess={handleQrScanned} />
                <p className="text-center text-[11px] font-mono text-slate-400">
                  Point camera at the QR code displayed on the Host Dashboard.
                </p>
              </div>
            )}

            {/* View B: Manual 6-Digit Code Input */}
            {joinMethod === 'MANUAL' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup();
                }}
                className="space-y-4 animate-fadeIn"
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
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xl font-bold tracking-wider placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase text-center"
                    />
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 mt-1.5 text-center">
                    The 6-character code generated for this checkpoint.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !joinCode.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Validating Code...' : 'Connect Checkpoint'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        ) : (
          /* Step 2: Confirm Staff Info & Enter Timing Interface */
          <form onSubmit={handleConfirmJoin} className="space-y-4 mt-5 animate-fadeIn">
            
            {/* Checkpoint Details Card */}
            {(() => {
              const roleInfo = getCheckpointRoleInfo(resolvedCheckpoint);
              const isStartOnly = roleInfo.typeDisplayName === 'START ONLY';
              const activeAssignment = getActiveCheckpointAssignment(resolvedCheckpoint, staffSessions);

              return (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-left space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold ${roleInfo.badgeClass}`}>
                      {roleInfo.typeDisplayName}
                    </span>
                    <div className="font-bold text-[11px]">
                      {activeAssignment.isHost ? (
                        <span className="text-amber-400">👑 Host Assigned</span>
                      ) : activeAssignment.isOccupied ? (
                        <span className="text-cyan-400">🔒 Occupied ({activeAssignment.staffName})</span>
                      ) : (
                        <span className="text-emerald-400">✓ Available</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xl font-bold text-slate-100">
                    {resolvedCheckpoint.name}
                  </div>

                  <div className="text-xs font-mono text-slate-300">
                    Distance: <strong>{isStartOnly ? '0.00 km' : formatDistance(resolvedCheckpoint.distanceMeters, resolvedRace?.displayUnit)}</strong>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Authority: <span className="text-slate-300 font-medium">{roleInfo.authorityDescription}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>Race: <strong className="text-slate-200">{resolvedRace?.name}</strong></span>
                    <span>Runner: <strong className="text-cyan-300">{resolvedRace?.runnerName}</strong></span>
                  </div>
                </div>
              );
            })()}

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
                  placeholder="e.g. Rahul Sharma (Finish Marshal)"
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
                  placeholder="e.g. Mobile Phone - Finish Gate"
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
                Change Code
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
