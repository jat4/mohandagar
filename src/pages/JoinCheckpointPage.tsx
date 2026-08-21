/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { Race, Checkpoint, normalizeCheckpointType } from '../types/race';
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
  Zap
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const JoinCheckpointPage: React.FC = () => {
  const { code: routeCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || searchParams.get('join') || '';
  const initialCode = (routeCode || queryCode || '').trim().toUpperCase();

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [joinMethod, setJoinMethod] = useState<'QR' | 'MANUAL'>(() => {
    return initialCode ? 'MANUAL' : 'QR';
  });

  const [joinCode, setJoinCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resolvingCode, setResolvingCode] = useState(Boolean(initialCode));
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
  const [needsFirstTimeSetup, setNeedsFirstTimeSetup] = useState(false);

  // Auto-join pipeline for QR code or route code
  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode);
      executeAutoJoin(initialCode);
    }
  }, [initialCode]);

  const executeAutoJoin = async (codeToLookup: string) => {
    const cleanCode = codeToLookup.trim().toUpperCase();
    if (!cleanCode) return;

    setResolvingCode(true);
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Resolve Join Code mapping from Firestore
      const mapping = await RaceService.resolveJoinCode(cleanCode);
      if (!mapping || !mapping.active) {
        setErrorMessage('Checkpoint QR is invalid or expired.');
        setResolvingCode(false);
        setLoading(false);
        return;
      }

      // 2. Fetch authoritative Race
      const race = await RaceService.getRace(mapping.raceId);
      if (!race) {
        setErrorMessage('Checkpoint QR is invalid or expired.');
        setResolvingCode(false);
        setLoading(false);
        return;
      }

      // 3. Locate Checkpoint
      const checkpoint = race.checkpoints?.find((c) => c.id === mapping.checkpointId);
      if (!checkpoint) {
        setErrorMessage('Checkpoint QR is invalid or expired.');
        setResolvingCode(false);
        setLoading(false);
        return;
      }

      setResolvedRace(race);
      setResolvedCheckpoint(checkpoint);

      // 4. Check if staff identity is available (stored in localStorage or assigned on checkpoint)
      const existingStoredStaff = localStorage.getItem('stopwatch_staff_name');
      const assignedStaff = checkpoint.assignedStaffName?.trim();
      const resolvedStaffName = existingStoredStaff || assignedStaff || '';

      if (resolvedStaffName) {
        // Staff identity is known -> complete auto-join immediately!
        const finalDeviceName = deviceName.trim() || 'Staff Phone';
        localStorage.setItem('stopwatch_staff_name', resolvedStaffName);
        localStorage.setItem('stopwatch_device_name', finalDeviceName);
        localStorage.setItem(`checkpoint_session_${checkpoint.id}`, JSON.stringify({
          raceId: race.id,
          checkpointId: checkpoint.id,
          joinCode: cleanCode,
          staffName: resolvedStaffName,
          deviceName: finalDeviceName
        }));

        // Register heartbeat session
        const sessionKey = `checkpoint_staff_session_${checkpoint.id}`;
        const savedSessionId = localStorage.getItem(sessionKey) || `session_${checkpoint.id}_${Date.now()}`;
        localStorage.setItem(sessionKey, savedSessionId);

        RaceService.updateStaffHeartbeat(race.id, savedSessionId, {
          id: savedSessionId,
          raceId: race.id,
          checkpointId: checkpoint.id,
          checkpointName: checkpoint.name,
          checkpointDistanceMeters: checkpoint.distanceMeters,
          staffName: resolvedStaffName,
          deviceName: finalDeviceName,
          status: 'ONLINE'
        }).catch((e) => console.warn('Heartbeat registration notice:', e));

        // Direct navigation to checkpoint live timing screen
        navigate(`/checkpoint/${checkpoint.id}?raceId=${race.id}`, { replace: true });
      } else {
        // First-time setup required: prompt once for staff name & device label
        setStaffName('Volunteer Staff');
        setNeedsFirstTimeSetup(true);
        setResolvingCode(false);
      }
    } catch (err: any) {
      console.error('Auto join execution error:', err);
      setErrorMessage(err.message || 'Checkpoint QR is invalid or expired.');
      setResolvingCode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQrScanned = (scannedText: string) => {
    let cleanCode = scannedText.trim();
    if (cleanCode.includes('/join/')) {
      cleanCode = cleanCode.split('/join/')[1].split('?')[0].split('/')[0];
    } else if (cleanCode.includes('code=')) {
      cleanCode = new URL(cleanCode).searchParams.get('code') || cleanCode;
    }
    cleanCode = cleanCode.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    setJoinCode(cleanCode);
    setJoinMethod('MANUAL');
    executeAutoJoin(cleanCode);
  };

  const handleFirstTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedCheckpoint || !resolvedRace) {
      setErrorMessage('Checkpoint QR is invalid or expired.');
      return;
    }

    const finalStaffName = staffName.trim() || 'Volunteer Staff';
    const finalDeviceName = deviceName.trim() || 'Staff Phone';

    // Store for all future QR scans
    localStorage.setItem('stopwatch_staff_name', finalStaffName);
    localStorage.setItem('stopwatch_device_name', finalDeviceName);
    localStorage.setItem(`checkpoint_session_${resolvedCheckpoint.id}`, JSON.stringify({
      raceId: resolvedRace.id,
      checkpointId: resolvedCheckpoint.id,
      joinCode: joinCode.trim(),
      staffName: finalStaffName,
      deviceName: finalDeviceName
    }));

    const sessionKey = `checkpoint_staff_session_${resolvedCheckpoint.id}`;
    const savedSessionId = localStorage.getItem(sessionKey) || `session_${resolvedCheckpoint.id}_${Date.now()}`;
    localStorage.setItem(sessionKey, savedSessionId);

    RaceService.updateStaffHeartbeat(resolvedRace.id, savedSessionId, {
      id: savedSessionId,
      raceId: resolvedRace.id,
      checkpointId: resolvedCheckpoint.id,
      checkpointName: resolvedCheckpoint.name,
      checkpointDistanceMeters: resolvedCheckpoint.distanceMeters,
      staffName: finalStaffName,
      deviceName: finalDeviceName,
      status: 'ONLINE'
    }).catch((e) => console.warn('Heartbeat registration notice:', e));

    showToast({
      type: 'success',
      title: 'Checkpoint Connected',
      message: `Connected to ${resolvedCheckpoint.name} (${resolvedRace.name})`
    });

    navigate(`/checkpoint/${resolvedCheckpoint.id}?raceId=${resolvedRace.id}`, { replace: true });
  };

  // 1. Loading/Resolving state when QR is scanned
  if (resolvingCode && !errorMessage && !needsFirstTimeSetup) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-slate-100 font-mono gap-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/40 p-3 shadow-xl shadow-cyan-500/10 flex items-center justify-center">
          <Activity className="w-7 h-7 text-cyan-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-100">Connecting to Checkpoint...</h2>
          <p className="text-xs text-slate-400">Resolving QR Code: <span className="text-cyan-300 font-bold">{initialCode || joinCode}</span></p>
        </div>
      </div>
    );
  }

  // 2. First-time setup modal if staff identity is completely new on this device
  if (needsFirstTimeSetup && resolvedCheckpoint && resolvedRace) {
    const normType = normalizeCheckpointType(resolvedCheckpoint.type);
    const isFinishOnly = normType === 'finish';
    const isSplitFinish = normType === 'splitFinish';

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/30 mx-auto flex items-center justify-center">
              <QrCode className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Checkpoint Setup
            </h1>
            <p className="text-xs font-mono text-slate-400">
              One-time setup for this device. Future scans will connect automatically.
            </p>
          </div>

          {/* Checkpoint Badge Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={`font-bold ${isFinishOnly ? 'text-rose-400' : isSplitFinish ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {isFinishOnly ? '🏁 FINISH LINE' : isSplitFinish ? '⚡ SPLIT GATE' : '⚡ SPLIT ONLY'}
              </span>
              <span className="text-slate-500">Code: #{resolvedCheckpoint.joinCode}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              {resolvedCheckpoint.name} ({formatDistance(resolvedCheckpoint.distanceMeters, resolvedRace.displayUnit)})
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Race: <span className="text-slate-200">{resolvedRace.name}</span> • Runner: <span className="text-cyan-300 font-bold">{resolvedRace.runnerName}</span>
            </div>
          </div>

          <form onSubmit={handleFirstTimeSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Staff Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Volunteer 1"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Device Name
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. iPhone 15"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer mt-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>JOIN CHECKPOINT</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Default QR Scanner / Manual Join Screen
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
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
            <CameraQrScanner onScan={handleQrScanned} />
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
                executeAutoJoin(joinCode.trim().toUpperCase());
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
                  placeholder="e.g. 8K4P29 or 8K4P-29"
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
                  <span>Connecting to Checkpoint...</span>
                </>
              ) : (
                <>
                  <span>CONNECT CHECKPOINT</span>
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
