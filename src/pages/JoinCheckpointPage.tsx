/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { auth } from '../lib/firebase';
import { Race, Checkpoint, StaffSession, normalizeCheckpointType, getActiveCheckpointAssignment, getCheckpointRoleInfo, formatCleanErrorMessage } from '../types/race';
import { formatDistance } from '../utils/raceCalculations';
import { CameraQrScanner } from '../components/race/CameraQrScanner';
import { 
  KeyRound, 
  ArrowRight, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  User, 
  ArrowLeft,
  Camera,
  Keyboard,
  Activity,
  ShieldCheck,
  Flag,
  Zap,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

/**
 * Extracts normalized join code from raw QR text, URLs, hash routes, or query params
 */
function extractJoinCode(rawInput: string): string {
  if (!rawInput) return '';
  const text = rawInput.trim();

  // Pattern 1: URL with query parameter ?code=... or ?join=...
  if (text.includes('?')) {
    try {
      const urlObj = new URL(text.startsWith('http') ? text : `https://mohandagar.in/${text.replace(/^#/, '')}`);
      const codeParam = urlObj.searchParams.get('code') || urlObj.searchParams.get('join');
      if (codeParam) {
        return codeParam.trim().toUpperCase();
      }
    } catch {
      const match = text.match(/[?&](?:code|join)=([^&#]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).trim().toUpperCase();
      }
    }
  }

  // Pattern 2: URL with /join/{code} or #/join/{code}
  if (text.includes('/join/')) {
    const parts = text.split('/join/')[1];
    if (parts) {
      const candidate = parts.split(/[?#/&]/)[0];
      if (candidate) {
        return candidate.trim().toUpperCase();
      }
    }
  }

  // Pattern 3: Clean alphanumeric + hyphens
  const cleaned = text.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  return cleaned;
}

export const JoinCheckpointPage: React.FC = () => {
  const { code: routeCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || searchParams.get('join') || '';
  const initialRaw = routeCode || queryCode || '';
  const initialCode = extractJoinCode(initialRaw);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [joinMethod, setJoinMethod] = useState<'QR' | 'MANUAL'>(() => {
    return initialCode ? 'MANUAL' : 'QR';
  });

  const [joinCode, setJoinCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resolvingCode, setResolvingCode] = useState(Boolean(initialCode));
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stored staff identity
  const [staffName, setStaffName] = useState(() => {
    return localStorage.getItem('stopwatch_staff_name') || '';
  });
  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem('stopwatch_device_name') || (
      typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        ? 'Mobile Device'
        : 'Checkpoint Device'
    );
  });

  const [resolvedRace, setResolvedRace] = useState<Race | null>(null);
  const [resolvedCheckpoint, setResolvedCheckpoint] = useState<Checkpoint | null>(null);
  const [staffSessions, setStaffSessions] = useState<StaffSession[]>([]);

  // If page loads with a join code in route/query param, resolve it
  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode);
      resolveCheckpointDetails(initialCode);
    }
  }, [initialCode]);

  // Live real-time subscription to race and staff sessions when resolved
  useEffect(() => {
    if (!resolvedRace?.id) return;
    const unsubRace = RaceService.subscribeToRace(
      resolvedRace.id,
      (race) => {
        if (race) {
          setResolvedRace(race);
          const cp = race.checkpoints?.find((c) => c.id === resolvedCheckpoint?.id);
          if (cp) setResolvedCheckpoint(cp);
        }
      },
      (err) => console.warn('Race subscription notice:', err)
    );

    const unsubSessions = RaceService.subscribeToStaffSessions(
      resolvedRace.id,
      (sessions) => {
        setStaffSessions(sessions);
      }
    );

    return () => {
      unsubRace();
      unsubSessions();
    };
  }, [resolvedRace?.id, resolvedCheckpoint?.id]);

  /**
   * Resolve Join Code to Race & Checkpoint from Firebase without auto-joining
   */
  const resolveCheckpointDetails = async (rawCodeToLookup: string) => {
    const cleanCode = extractJoinCode(rawCodeToLookup);
    if (!cleanCode) return;

    setResolvingCode(true);
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Resolve Join Code mapping from Firestore
      const mapping = await RaceService.resolveJoinCode(cleanCode);
      if (!mapping || !mapping.active) {
        setErrorMessage('Invalid or expired checkpoint QR.');
        setResolvedRace(null);
        setResolvedCheckpoint(null);
        setResolvingCode(false);
        setLoading(false);
        return;
      }

      // 2. Fetch authoritative Race
      const race = await RaceService.getRace(mapping.raceId);
      if (!race) {
        setErrorMessage('Invalid or expired checkpoint QR.');
        setResolvedRace(null);
        setResolvedCheckpoint(null);
        setResolvingCode(false);
        setLoading(false);
        return;
      }

      // 3. Locate Checkpoint
      const checkpoint = race.checkpoints?.find((c) => c.id === mapping.checkpointId);
      if (!checkpoint) {
        setErrorMessage('Invalid or expired checkpoint QR.');
        setResolvedRace(null);
        setResolvedCheckpoint(null);
        setResolvingCode(false);
        setLoading(false);
        return;
      }

      // Successfully resolved race & checkpoint!
      setResolvedRace(race);
      setResolvedCheckpoint(checkpoint);
      setJoinCode(checkpoint.joinCode || cleanCode);

      if (!staffName.trim()) {
        const savedName = localStorage.getItem('stopwatch_staff_name');
        setStaffName(savedName || 'Volunteer Staff');
      }

      setResolvingCode(false);
    } catch (err: any) {
      console.error('Resolve checkpoint error:', err);
      setErrorMessage(formatCleanErrorMessage(err, 'Invalid or expired checkpoint QR.'));
      setResolvedRace(null);
      setResolvedCheckpoint(null);
      setResolvingCode(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle QR scan event
   */
  const handleQrScanned = (scannedData: string) => {
    const cleanCode = extractJoinCode(scannedData);
    if (!cleanCode) {
      setErrorMessage('Invalid or expired checkpoint QR.');
      return;
    }
    setJoinCode(cleanCode);
    resolveCheckpointDetails(cleanCode);
  };

  /**
   * Confirm and Join Checkpoint -> Opens checkpoint timing screen
   */
  const handleJoinCheckpoint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resolvedCheckpoint || !resolvedRace) {
      setErrorMessage('Invalid or expired checkpoint QR.');
      return;
    }

    // Check if checkpoint is already occupied by another staff member / device
    const activeAssignment = getActiveCheckpointAssignment(resolvedCheckpoint, staffSessions);
    const finalStaffName = staffName.trim() || 'Volunteer Staff';
    const finalDeviceName = deviceName.trim() || 'Mobile Device';
    const currentUid = auth.currentUser?.uid;

    const isSameUser = Boolean(
      (currentUid && resolvedCheckpoint.assignedStaffUid && currentUid === resolvedCheckpoint.assignedStaffUid) ||
      (finalStaffName && activeAssignment.staffName && finalStaffName.toLowerCase() === activeAssignment.staffName.toLowerCase()) ||
      (resolvedCheckpoint.isHostAssigned && currentUid === resolvedRace.hostUid)
    );

    if (activeAssignment.isOccupied && !isSameUser) {
      setErrorMessage(`CHECKPOINT ALREADY OCCUPIED: Checkpoint ${resolvedCheckpoint.name} is currently assigned to ${activeAssignment.staffName}. You cannot join this checkpoint until the current staff member leaves.`);
      return;
    }

    setJoining(true);

    try {
      // 1. Claim checkpoint atomically with Firestore transaction protection
      await RaceService.claimCheckpoint({
        raceId: resolvedRace.id,
        checkpointId: resolvedCheckpoint.id,
        staffName: finalStaffName,
        deviceName: finalDeviceName
      });

      // 2. Save to localStorage for session persistence only AFTER successful atomic claim
      localStorage.setItem('stopwatch_staff_name', finalStaffName);
      localStorage.setItem('stopwatch_device_name', finalDeviceName);
      localStorage.setItem(`checkpoint_session_${resolvedCheckpoint.id}`, JSON.stringify({
        raceId: resolvedRace.id,
        checkpointId: resolvedCheckpoint.id,
        joinCode: joinCode.trim(),
        staffName: finalStaffName,
        deviceName: finalDeviceName
      }));

      // 3. Register staff session heartbeat
      const sessionKey = `checkpoint_staff_session_${resolvedCheckpoint.id}`;
      const savedSessionId = localStorage.getItem(sessionKey) || `session_${resolvedCheckpoint.id}_${Date.now()}`;
      localStorage.setItem(sessionKey, savedSessionId);

      await RaceService.updateStaffHeartbeat(resolvedRace.id, savedSessionId, {
        id: savedSessionId,
        raceId: resolvedRace.id,
        checkpointId: resolvedCheckpoint.id,
        checkpointName: resolvedCheckpoint.name,
        checkpointDistanceMeters: resolvedCheckpoint.distanceMeters,
        staffName: finalStaffName,
        deviceName: finalDeviceName,
        status: 'ONLINE'
      }).catch((err) => console.warn('Heartbeat update notice:', err));

      showToast({
        type: 'success',
        title: 'Checkpoint Connected',
        message: `Connected to ${resolvedCheckpoint.name} (${resolvedRace.name})`
      });

      // 4. Navigate to checkpoint timing screen
      navigate(`/checkpoint/${resolvedCheckpoint.id}?raceId=${resolvedRace.id}`, { replace: true });
    } catch (err: any) {
      console.error('Join checkpoint error:', err);
      setErrorMessage(formatCleanErrorMessage(err, 'Unable to connect to checkpoint.'));
      setJoining(false);
    }
  };

  /**
   * Reset view to scan again or enter code
   */
  const handleReset = () => {
    setResolvedRace(null);
    setResolvedCheckpoint(null);
    setJoinCode('');
    setErrorMessage(null);
    setResolvingCode(false);
  };

  // 1. Loading/Resolving state during Firebase lookup
  if (resolvingCode && !errorMessage && !resolvedCheckpoint) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-slate-100 font-mono gap-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 p-3 shadow-xl shadow-cyan-500/10 flex items-center justify-center">
          <Activity className="w-7 h-7 text-cyan-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-100">Resolving Checkpoint...</h2>
          <p className="text-xs text-slate-400">Verifying join code with race database</p>
        </div>
      </div>
    );
  }

  // 2. Resolved Checkpoint View: Displays Race + Checkpoint details & [ JOIN CHECKPOINT ] button
  if (resolvedCheckpoint && resolvedRace) {
    const roleInfo = getCheckpointRoleInfo(resolvedCheckpoint);
    const isStartOnly = roleInfo.typeDisplayName === 'START ONLY';
    const activeAssignment = getActiveCheckpointAssignment(resolvedCheckpoint, staffSessions);

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {/* Header Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ QR CODE DETECTED</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Checkpoint Information
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Verified with live race database
            </p>
          </div>

          {/* Error message banner if occupied or join error */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Structured Race & Checkpoint Details Card */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden divide-y divide-slate-800/60 font-mono text-xs">
            
            {/* Race Name */}
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0 font-medium">Race Name:</span>
              <span className="text-slate-100 font-bold text-sm text-right truncate">
                {resolvedRace.name}
              </span>
            </div>

            {/* Runner */}
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0 font-medium">Runner:</span>
              <span className="text-cyan-300 font-bold text-sm text-right truncate">
                {resolvedRace.runnerName}
              </span>
            </div>

            {/* Checkpoint */}
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0 font-medium">Checkpoint:</span>
              <span className="text-slate-100 font-bold text-sm text-right truncate">
                {resolvedCheckpoint.name}
              </span>
            </div>

            {/* Distance */}
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0 font-medium">Distance:</span>
              <span className="text-slate-200 font-bold text-sm text-right">
                {isStartOnly ? '0.00 km' : formatDistance(resolvedCheckpoint.distanceMeters, resolvedRace.displayUnit)}
              </span>
            </div>

            {/* Type & Authority */}
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0 font-medium">Type:</span>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${roleInfo.badgeClass}`}>
                  {roleInfo.typeDisplayName}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Authority: {roleInfo.authorityDescription}
                </span>
              </div>
            </div>

            {/* Current Assignment / Capacity */}
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-slate-400 shrink-0 font-medium">Gate Status:</span>
              <div className="text-right font-bold text-xs">
                {activeAssignment.isHost ? (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    👑 Host Assigned ({activeAssignment.staffName || 'Host'})
                  </span>
                ) : activeAssignment.isOccupied ? (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                    🔒 Occupied — {activeAssignment.staffName}
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                    ✓ Available (1 Max Device)
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Optional Staff Identification Inputs */}
          <form onSubmit={handleJoinCheckpoint} className="space-y-4">
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Staff Name</span>
                  <span className="text-[10px] text-slate-500">Displays on host race board</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Volunteer Staff"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Device Name</span>
                  <span className="text-[10px] text-slate-500">Device label</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. Staff Phone"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Primary Action Button: JOIN CHECKPOINT */}
            <button
              type="submit"
              disabled={joining}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black font-mono text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99] tracking-wider"
            >
              {joining ? (
                <>
                  <Activity className="w-5 h-5 animate-spin text-slate-950" />
                  <span>CONNECTING...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>JOIN CHECKPOINT</span>
                </>
              )}
            </button>
          </form>

          {/* Reset / Scan Another Button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan another QR or enter different code</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 3. Default QR Scanner / Manual Join Screen
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        <Link
          to="/home"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/30 mx-auto mb-3 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <QrCode className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Checkpoint Join
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Scan checkpoint QR or enter code to record runner splits
          </p>
        </div>

        {/* Join Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setJoinMethod('QR');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              joinMethod === 'QR'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setJoinMethod('MANUAL');
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              joinMethod === 'MANUAL'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Enter Code</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* QR Scanner Mode */}
        {joinMethod === 'QR' && (
          <div className="space-y-4">
            <CameraQrScanner onScanSuccess={handleQrScanned} onScan={handleQrScanned} />
            <p className="text-[11px] font-mono text-center text-slate-500">
              Point camera at the QR code displayed on the Host dashboard
            </p>
          </div>
        )}

        {/* Manual Code Input Mode */}
        {joinMethod === 'MANUAL' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.trim()) {
                resolveCheckpointDetails(joinCode.trim());
              }
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Checkpoint Join Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={12}
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 8K4P-29"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-base tracking-wider uppercase text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Resolving Checkpoint...</span>
                </>
              ) : (
                <>
                  <span>LOOKUP CHECKPOINT</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
