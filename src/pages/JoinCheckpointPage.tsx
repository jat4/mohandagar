/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { RaceService } from '../services/raceService';
import { Race, Checkpoint, TimingEvent } from '../types/race';
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
  Flag,
  Sparkles, 
  ArrowLeft,
  Camera,
  Keyboard,
  ShieldCheck,
  Activity,
  Layers
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
  const [staffName, setStaffName] = useState(() => {
    return localStorage.getItem('stopwatch_staff_name') || '';
  });
  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem('stopwatch_device_name') || (
      navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Tablet / Laptop'
    );
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resolvedRace, setResolvedRace] = useState<Race | null>(null);
  const [resolvedCheckpoint, setResolvedCheckpoint] = useState<Checkpoint | null>(null);

  // Auto-resolve code when provided via URL
  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode);
      setJoinMethod('MANUAL');
      handleLookup(initialCode);
    }
  }, [initialCode]);

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
        setErrorMessage(`Checkpoint join code "${code}" is invalid or expired.`);
        setResolvedRace(null);
        setResolvedCheckpoint(null);
        return;
      }

      const race = await RaceService.getRace(mapping.raceId);
      if (!race) {
        setErrorMessage('Race was not found or has been removed.');
        setResolvedRace(null);
        setResolvedCheckpoint(null);
        return;
      }

      const checkpoint = race.checkpoints?.find((c) => c.id === mapping.checkpointId);
      if (!checkpoint) {
        setErrorMessage('Assigned checkpoint was not found in race.');
        setResolvedRace(null);
        setResolvedCheckpoint(null);
        return;
      }

      setResolvedRace(race);
      setResolvedCheckpoint(checkpoint);
      setJoinCode(code);

      if (checkpoint.assignedStaffName && !staffName) {
        setStaffName(checkpoint.assignedStaffName);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error looking up join code.');
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
    cleanCode = cleanCode.toUpperCase();
    setJoinCode(cleanCode);
    setJoinMethod('MANUAL');
    navigate(`/join/${cleanCode}`);
    handleLookup(cleanCode);
  };

  const handleConfirmJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      setErrorMessage('Please provide your name or device label.');
      return;
    }

    if (!resolvedCheckpoint || !resolvedRace) {
      setErrorMessage('Please lookup a valid checkpoint code first.');
      return;
    }

    // Save session in localStorage so checkpoint recovers if refreshed
    localStorage.setItem('stopwatch_staff_name', staffName.trim());
    localStorage.setItem('stopwatch_device_name', deviceName.trim());
    localStorage.setItem(`checkpoint_session_${resolvedCheckpoint.id}`, JSON.stringify({
      raceId: resolvedRace.id,
      checkpointId: resolvedCheckpoint.id,
      joinCode: joinCode.trim(),
      staffName: staffName.trim(),
      deviceName: deviceName.trim()
    }));

    showToast({
      type: 'success',
      title: 'Joined Gate',
      message: `Connected to ${resolvedCheckpoint.name} (${resolvedRace.name})`
    });

    // Navigate to clean checkpoint route
    navigate(`/checkpoint/${resolvedCheckpoint.id}?raceId=${resolvedRace.id}`);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        
        {/* Back Button */}
        <Link
          to="/home"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/30 p-[1px] mx-auto mb-3 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
            <QrCode className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Volunteer Checkpoint Join
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Connect your phone to record live splits for the runner
          </p>
        </div>

        {/* Input Toggle (Camera QR Scanner vs Manual Code) */}
        {!resolvedCheckpoint && (
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setJoinMethod('QR')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                joinMethod === 'QR'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setJoinMethod('MANUAL')}
              className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                joinMethod === 'MANUAL'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Enter 6-Digit Code</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* QR Scanner Mode */}
        {joinMethod === 'QR' && !resolvedCheckpoint && (
          <div className="space-y-4">
            <CameraQrScanner onScan={handleQrScanned} />
            <p className="text-[11px] font-mono text-center text-slate-500">
              Point camera at the QR code shown on the race host's screen
            </p>
          </div>
        )}

        {/* Manual Code Input Mode */}
        {joinMethod === 'MANUAL' && !resolvedCheckpoint && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.trim()) {
                navigate(`/join/${joinCode.trim().toUpperCase()}`);
                handleLookup();
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Checkpoint Join Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 8K4P29"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm tracking-wider uppercase text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Looking up Checkpoint...</span>
                </>
              ) : (
                <>
                  <span>Find Checkpoint</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Resolved Checkpoint Card & Staff Confirmation Form */}
        {resolvedCheckpoint && resolvedRace && (
          <form onSubmit={handleConfirmJoin} className="space-y-5 animate-fadeIn">
            
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gate Identified</span>
                </span>
                <span className="text-slate-500">#{resolvedCheckpoint.joinCode}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                {resolvedCheckpoint.name} ({formatDistance(resolvedCheckpoint.distanceMeters, resolvedRace.displayUnit)})
              </h2>
              <div className="text-xs font-mono text-slate-400">
                Race: <strong className="text-slate-200">{resolvedRace.name}</strong> • Runner: <strong className="text-slate-200">{resolvedRace.runnerName}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Your Name / Volunteer Identity
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                Device Label
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setResolvedCheckpoint(null);
                  setResolvedRace(null);
                }}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs cursor-pointer transition-colors"
              >
                Change
              </button>

              <button
                type="submit"
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold font-mono text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>CONFIRM & OPEN GATE</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
