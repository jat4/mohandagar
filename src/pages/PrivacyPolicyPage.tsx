/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Database, 
  Lock, 
  UserCheck, 
  Globe, 
  Trash2, 
  HardDrive, 
  Layers, 
  Mail,
  FileText
} from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn font-mono">
      
      {/* Navigation Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          to="/home"
          id="privacy-policy-back-top"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center sm:text-left mb-10 pb-8 border-b border-slate-900 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LEGAL &amp; PRIVACY DOCUMENTATION</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight font-sans">
          Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          How Runner Stopwatch handles information used for race timing and results.
        </p>
      </div>

      {/* Main Privacy Policy Sections */}
      <div className="space-y-6 sm:space-y-8">

        {/* 1. Information We Collect */}
        <section id="section-info-collected" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              1. Information We Collect
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch processes only the necessary operational data required to conduct timing sessions, manage checkpoint synchronization, and generate sports analytics:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Host Account Information:</strong> Email address and authentication credentials provided during Host sign-up or sign-in.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Race &amp; Event Metadata:</strong> Race title, planned route distance, unit preferences, and custom checkpoint configurations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Runner Information:</strong> Runner or athlete identifier names associated with specific race entries.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Timing &amp; Telemetry Data:</strong> Start timestamps, split timestamps, checkpoint distance marks, segment pace, and finish timestamps.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Staff &amp; Checkpoint Session Data:</strong> Volunteer staff display names, device labels, and active checkpoint presence heartbeats.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span><strong>Technical Session Information:</strong> Basic browser connection states, network status, and time synchronization offsets required for authoritative clock operations.</span>
            </li>
          </ul>
        </section>

        {/* 2. How We Use Information */}
        <section id="section-how-we-use" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              2. How We Use Information
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Information processed by Runner Stopwatch is used strictly for core application functionality:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Create and manage race timing sessions</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Synchronize checkpoint timers in real time</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Record splits, paces, and finish timestamps</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Generate pace/speed graphs and race metrics</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Display published results on the public leaderboard</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Provide secure host authentication and access control</span>
            </div>
          </div>
        </section>

        {/* 3. Firebase / Cloud Services */}
        <section id="section-cloud-services" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              3. Firebase / Cloud Services
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch utilizes Firebase and Google Cloud platform services for authentication management, persistent document storage (Cloud Firestore), and real-time WebSocket state distribution across multi-device checkpoints. All cloud transactions are governed by authenticated security rules.
          </p>
        </section>

        {/* 4. Public Race Results */}
        <section id="section-public-results" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              4. Public Race Results
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Race results are <strong>private by default</strong> and restricted to the Host's authenticated account. A race result only becomes visible on the public Results directory (`/results`) when the Host explicitly toggles the <strong>Publish</strong> control. When published, the event name, runner name, total time, split milestones, and calculated paces become publicly discoverable. Hosts may unpublish results at any time.
          </p>
        </section>

        {/* 5. Data Deletion */}
        <section id="section-data-deletion" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              5. Data Deletion
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            When a Host deletes a race from their dashboard, the application triggers a deletion routine that removes the race record, checkpoint entries, and any published public results from the active database in accordance with the application's deletion logic.
          </p>
        </section>

        {/* 6. Data Security */}
        <section id="section-data-security" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              6. Data Security
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Access to race administration, timing controls, and unpublished results is secured through cryptographic token validation and database security rules. While we implement standard industry practices and SSL/TLS encryption for all data in transit, no internet-based transmission or digital storage system can be guaranteed to be 100% impenetrable.
          </p>
        </section>

        {/* 7. Cookies / Local Storage */}
        <section id="section-cookies-storage" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              7. Cookies &amp; Local Storage
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch does not use tracking cookies or marketing beacons. The application uses client-side <code>localStorage</code> solely to remember volunteer device names, checkpoint staff identifiers, and transient race draft states across browser reloads.
          </p>
        </section>

        {/* 8. Third-Party Services */}
        <section id="section-third-party" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              8. Third-Party Services
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Our infrastructure relies exclusively on Firebase and Google Cloud platform services for operational uptime, cloud hosting, and database reliability. We do not sell, rent, or share personal information with third-party advertisers or data brokers.
          </p>
        </section>

        {/* 9. Children's Privacy */}
        <section id="section-childrens-privacy" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              9. Children's Privacy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch is a sports timing tool designed for race directors, athletic clubs, and coaches. We do not knowingly collect personal information directly from children under 13 without appropriate supervisor or race organizer guidance.
          </p>
        </section>

        {/* 10. Changes to This Privacy Policy */}
        <section id="section-changes" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              10. Changes to This Privacy Policy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            We may occasionally update this Privacy Policy to reflect enhancements in race timing architecture or changes in legal regulations. Updates will be reflected directly on this page.
          </p>
        </section>

        {/* 11. Contact */}
        <section id="section-contact" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              11. Contact
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            For inquiries, data requests, or timing support, please reach out to:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <a 
              href="mailto:support@mohandagar.in"
              id="privacy-contact-email"
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-bold inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>support@mohandagar.in</span>
            </a>
          </div>
        </section>

      </div>

      {/* Bottom CTA / Return Button */}
      <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/home"
          id="privacy-policy-back-bottom"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-all text-xs font-bold w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

    </div>
  );
};
