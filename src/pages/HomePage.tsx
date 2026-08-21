/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Timer, 
  QrCode, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  Users, 
  Award, 
  Layers, 
  CheckCircle2,
  Sparkles,
  Play
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isHost } = useAuth();
  const [quickCode, setQuickCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Please enter a 6-character Join Code.');
      return;
    }
    navigate(`/join/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 animate-fadeIn">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 shadow-lg shadow-cyan-500/5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Multi-Device Millisecond Cloud Synchronized Timing</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-tight mb-5">
          Professional Race Stopwatch <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
            Across Any Device
          </span>
        </h1>

        <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-mono mb-10 leading-relaxed">
          Host sets the race. Volunteer checkpoint staff simply scan a QR code or enter a 6-character code to record real-time splits from their phones. Zero custom hardware required.
        </p>

        {/* Quick Action Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left max-w-5xl mx-auto">
          
          {/* Staff Checkpoint Join Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative flex flex-col justify-between hover:border-cyan-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-cyan-400/80 font-bold uppercase tracking-wider">
                  No App Needed
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">
                Volunteer Staff
              </h2>
              <p className="text-xs font-mono text-slate-400 mb-5 leading-relaxed">
                Assigned to a timing gate? Enter the 6-character race code or scan the checkpoint QR card to begin split timing.
              </p>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 8K4P29"
                  maxLength={10}
                  value={quickCode}
                  onChange={(e) => {
                    setQuickCode(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  className="flex-1 px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs uppercase text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-1 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <span>JOIN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {errorMsg && (
                <div className="text-[11px] font-mono text-rose-400">{errorMsg}</div>
              )}
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-500">
                <Link to="/join" className="text-cyan-400 hover:underline flex items-center gap-1">
                  <span>Open Camera QR</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </form>
          </div>

          {/* Public Race Results Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative flex flex-col justify-between hover:border-amber-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-amber-950 border border-amber-500/30 text-amber-400">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-amber-400/80 font-bold uppercase tracking-wider">
                  Public Directory
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">
                Official Race Results
              </h2>
              <p className="text-xs font-mono text-slate-400 mb-5 leading-relaxed">
                Browse verified checkpoint splits, pace curves, official finisher times, and shareable QR cards.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/results"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black font-mono text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Award className="w-4 h-4 text-slate-950" />
                <span>EXPLORE RESULTS</span>
              </Link>
              <div className="text-center">
                <Link to="/results" className="text-xs font-mono text-slate-400 hover:text-amber-400 underline">
                  View Leaderboards & Splits
                </Link>
              </div>
            </div>
          </div>

          {/* Host Race Controller Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative flex flex-col justify-between hover:border-emerald-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-2xl bg-emerald-950 border border-emerald-500/30 text-emerald-400">
                  <Timer className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono text-emerald-400/80 font-bold uppercase tracking-wider">
                  Host Dashboard
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-1">
                Race Director & Host
              </h2>
              <p className="text-xs font-mono text-slate-400 mb-5 leading-relaxed">
                Configure distance, customize checkpoints, distribute QR cards, and monitor live splits in real-time.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link
                to={isHost ? "/host/dashboard" : "/login"}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{isHost ? "HOST DASHBOARD" : "HOST SIGN IN"}</span>
              </Link>
              {isHost && (
                <div className="text-center">
                  <Link to="/host/races" className="text-xs font-mono text-slate-400 hover:text-cyan-400 underline">
                    Past Race History
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Engineered for Precision & Speed
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1.5">
            Every layer synchronized to authoritative cloud atomic timestamps
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="p-2.5 w-fit rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Zero Device Latency</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Calculates NTP offset between phones and server so every checkpoint records true elapsed time regardless of device clock drift.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Instant QR Joining</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Print or display QR codes on host screens. Staff scan and get immediate access to their specific checkpoint gate in seconds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
            <div className="p-2.5 w-fit rounded-xl bg-blue-950/80 border border-blue-500/30 text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Official PDF Result Certificates</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Generate pace/speed graphs, identify missed gates with clean gap markers, and download official verified race result PDF certificates.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
