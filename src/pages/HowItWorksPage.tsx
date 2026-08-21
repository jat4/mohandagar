/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Timer, 
  ArrowLeft, 
  Flag, 
  MapPin, 
  QrCode, 
  Play, 
  Zap, 
  CheckCircle2, 
  TrendingUp, 
  Globe, 
  Download, 
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn font-mono">
      
      {/* Navigation Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          to="/home"
          id="how-it-works-back-top"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center sm:text-left mb-10 pb-8 border-b border-slate-900 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-bold">
          <Timer className="w-3.5 h-3.5" />
          <span>RUNNER STOPWATCH WORKFLOW</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight font-sans">
          How Runner Stopwatch Works
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          Real-time multi-device race timing with synchronized checkpoint tracking.
        </p>
      </div>

      {/* Workflow Steps Grid */}
      <div className="space-y-6 sm:space-y-8">

        {/* 01 — HOST CREATES A RACE */}
        <section id="step-01" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                01
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                HOST CREATES A RACE
              </h2>
            </div>
            <Flag className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            The Host initializes an authoritative timing session from the Host Dashboard by providing the core race parameters:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span><strong>Race / Event Name</strong> (e.g. 5K Championship)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span><strong>Runner Name</strong> (individual or bib assigned)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span><strong>Planned Distance</strong> (meters, kilometers, miles)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span><strong>Timing Checkpoints / Gates</strong> along the route</span>
            </div>
          </div>
        </section>

        {/* 02 — SET UP CHECKPOINTS */}
        <section id="step-02" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                02
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                SET UP CHECKPOINTS
              </h2>
            </div>
            <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Each checkpoint along the course is assigned a specific distance mark from the start line. Checkpoints receive automated join credentials and specific operational authority:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-cyan-400 font-bold mb-1">Checkpoint Identity</div>
              <div className="text-slate-400">Custom name and calibrated route distance.</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-cyan-400 font-bold mb-1">Unique Join Code</div>
              <div className="text-slate-400">6-character code (e.g. 8K4P-29) for manual entry.</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-cyan-400 font-bold mb-1">Instant QR Code</div>
              <div className="text-slate-400">Point-and-shoot camera connection for field marshals.</div>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Checkpoint Authority Types:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                <div className="text-emerald-400 font-bold">Split Gate (Split &amp; Finish)</div>
                <div className="text-slate-400">Can record intermediate runner splits and trigger official race finish.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
                <div className="text-cyan-400 font-bold">Split (Split Only)</div>
                <div className="text-slate-400">Can record intermediate segment splits; cannot finish the race.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1">
                <div className="text-rose-400 font-bold">Finish Line (Finish Only)</div>
                <div className="text-slate-400">Dedicated finish station that completes the race; cannot record splits.</div>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — STAFF JOINS A CHECKPOINT */}
        <section id="step-03" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                03
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                STAFF JOINS A CHECKPOINT
              </h2>
            </div>
            <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Field staff and checkpoint timers join using any mobile browser with camera support:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>QR Code Scan:</strong> Scanning the checkpoint QR immediately identifies the race and checkpoint, opening the verified confirmation screen with zero manual URL copying.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Checkpoint Join Code:</strong> Staff can also manually enter the 6-character code on the Staff Join page.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Device &amp; Staff Labeling:</strong> Field members enter their name and device label so the Host can monitor online marshal presence in real time.</span>
            </li>
          </ul>
        </section>

        {/* 04 — HOST STARTS THE RACE */}
        <section id="step-04" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                04
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                HOST STARTS THE RACE
              </h2>
            </div>
            <Play className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            The Host starts the official clock when the starting gun or whistle sounds:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Instant Cloud State Synchronization</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              When the Host starts the race, the authoritative start timestamp is recorded. Connected checkpoint devices automatically receive the active race state and start ticking synchronously in sub-millisecond precision — without requiring any manual page refresh.
            </p>
          </div>
        </section>

        {/* 05 — RECORD CHECKPOINT SPLITS */}
        <section id="step-05" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                05
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                RECORD CHECKPOINT SPLITS
              </h2>
            </div>
            <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            As the runner crosses a gate, the marshal taps the high-contrast <strong>Split</strong> button. The system automatically computes and records:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
              <div className="text-cyan-400 font-bold">Split Time</div>
              <div className="text-[11px] text-slate-500">Cumulative clock</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
              <div className="text-cyan-400 font-bold">Distance</div>
              <div className="text-[11px] text-slate-500">Segment meters</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
              <div className="text-cyan-400 font-bold">Pace</div>
              <div className="text-[11px] text-slate-500">min/km or min/mi</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
              <div className="text-cyan-400 font-bold">Speed</div>
              <div className="text-[11px] text-slate-500">km/h or mph</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/40 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-cyan-300">Resilient Segment Calculation</div>
            <p className="text-slate-400 leading-relaxed">
              If a previous checkpoint was missed or offline, subsequent checkpoints dynamically compute their split from the most recent successfully logged checkpoint. For example: if Checkpoint 1 (1 km) is recorded, Checkpoint 2 (2 km) is missed, and Checkpoint 3 (3 km) is logged, Checkpoint 3 correctly records a 2 km segment from CP1.
            </p>
          </div>
        </section>

        {/* 06 — FINISH THE RACE */}
        <section id="step-06" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                06
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                FINISH THE RACE
              </h2>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            When the runner crosses the finish line, staff or host presses <strong>Finish Race</strong>:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Instant Timestamp Capture:</strong> The exact millisecond the button is pressed is locked immediately. Verification dialogs never delay or skew the official finish time.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Safety Confirmation:</strong> If confirmed, the race completes with the frozen timestamp. If canceled, the clock continues seamlessly without data loss.</span>
            </li>
          </ul>
        </section>

        {/* 07 — RACE ANALYSIS */}
        <section id="step-07" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                07
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                RACE ANALYSIS
              </h2>
            </div>
            <TrendingUp className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Upon race conclusion, the analytics engine generates an in-depth athletic breakdown:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">Final Time</span>
              <p className="text-[11px] text-slate-500">Official chip duration</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">Total Distance</span>
              <p className="text-[11px] text-slate-500">Completed route</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">Average Pace</span>
              <p className="text-[11px] text-slate-500">Overall tempo</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">Average Speed</span>
              <p className="text-[11px] text-slate-500">Mean velocity</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-emerald-400 font-bold">Fastest Split</span>
              <p className="text-[11px] text-slate-500">Peak pace gate</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-rose-400 font-bold">Slowest Split</span>
              <p className="text-[11px] text-slate-500">Toughest segment</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 col-span-2">
              <span className="text-cyan-400 font-bold">Interactive Split Charts</span>
              <p className="text-[11px] text-slate-500">Pace progression and velocity trendlines</p>
            </div>
          </div>
        </section>

        {/* 08 — RESULTS */}
        <section id="step-08" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                08
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                RESULTS
              </h2>
            </div>
            <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Results privacy and lifecycle remain under full Host authority:
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Review &amp; Audit:</strong> Hosts review split anomalies, staff notes, and timestamps before publishing.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Publish / Unpublish:</strong> Only explicitly published race results appear on the public Results directory (`/results`). Hosts can toggle results offline at any time.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Data Purge / Deletion:</strong> Deleting a race permanently cleanses the race entity and public result listing from the database according to backend deletion routines.</span>
            </div>
          </div>
        </section>

        {/* 09 — EXPORT */}
        <section id="step-09" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-sm sm:text-base font-bold bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                09
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
                EXPORT
              </h2>
            </div>
            <Download className="w-5 h-5 text-cyan-400 shrink-0" />
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Finished race results can be downloaded as official PDF certificates formatted for print, athlete records, or archival:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-cyan-400 font-bold mb-1">Official PDF Certificate</div>
              <div className="text-slate-400">Professional vector-formatted certificates with race badges, athlete names, verified total time, and split table.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-cyan-400 font-bold mb-1">Performance Breakdown</div>
              <div className="text-slate-400">Includes best and slowest split segments, average pace, speed, and gate-by-gate timings.</div>
            </div>
          </div>
        </section>

      </div>

      {/* Bottom CTA / Return Button */}
      <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/home"
          id="how-it-works-back-bottom"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-all text-xs font-bold w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Link
          to="/host/race/new"
          id="how-it-works-create-race-cta"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all w-full sm:w-auto"
        >
          <span>Create a Race Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};
