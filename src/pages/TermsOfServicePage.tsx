/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  CheckSquare, 
  Server, 
  ShieldAlert, 
  Users, 
  Timer, 
  Award, 
  KeyRound, 
  QrCode, 
  AlertTriangle, 
  Database, 
  Globe, 
  Activity, 
  Layers, 
  Copyright, 
  HelpCircle, 
  PowerOff, 
  RefreshCw, 
  Mail 
} from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn font-mono">
      
      {/* Navigation Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          to="/home"
          id="terms-of-service-back-top"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center sm:text-left mb-10 pb-8 border-b border-slate-900 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          <span>TERMS &amp; CONDITIONS</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight font-sans">
          Terms of Service
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          Terms and conditions for using Runner Stopwatch.
        </p>
      </div>

      {/* Main Terms Sections */}
      <div className="space-y-6 sm:space-y-8">

        {/* 1. ACCEPTANCE OF TERMS */}
        <section id="section-acceptance" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              1. Acceptance of Terms
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            By accessing or using Runner Stopwatch, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not access or use the service.
          </p>
        </section>

        {/* 2. DESCRIPTION OF THE SERVICE */}
        <section id="section-description" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              2. Description of the Service
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch is a web-based multi-device race timing software application designed to provide:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Creation and configuration of timing sessions</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Multi-gate route distance calibration</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Checkpoint joining via QR or Join Codes</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Split and finish timestamp logging</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Real-time cross-device clock synchronization</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Pace, velocity, and split trend analysis</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Public and private leaderboard publishing</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span>Downloadable official PDF race certificates</span>
            </div>
          </div>
        </section>

        {/* 3. HOST RESPONSIBILITIES */}
        <section id="section-host-responsibilities" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              3. Host Responsibilities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Race Hosts maintain authoritative oversight over their timing sessions and are responsible for:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Entering accurate race titles, event distance parameters, and runner details.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Assigning correct physical distance marks to each checkpoint gate.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Distributing appropriate QR codes and Join Codes to designated staff members.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Starting, monitoring, and controlling the official race state.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Auditing split entries and timestamps before publishing public results.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Managing public visibility and deleting race records when appropriate.</span>
            </li>
          </ul>
        </section>

        {/* 4. CHECKPOINT STAFF RESPONSIBILITIES */}
        <section id="section-staff-responsibilities" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              4. Checkpoint Staff Responsibilities
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Volunteer timers and checkpoint staff are responsible for:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Joining the designated checkpoint corresponding to their physical location on course.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Maintaining their device active, charged, and connected during active timing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Triggering the Split or Finish action promptly as the athlete crosses the gate mark.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>Exercising care to prevent accidental double-taps or duplicate entries.</span>
            </li>
          </ul>
        </section>

        {/* 5. TIMING ACCURACY */}
        <section id="section-timing-accuracy" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              5. Timing Accuracy
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch is a software-based sports timing tool. Actual recorded timestamps and precision are subject to factors including:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Mobile device hardware capabilities and clock oscillator stability</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Web browser performance and background tab throttling</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Cellular and Wi-Fi network latency, jitter, and connectivity drops</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Device operating system power-saving policies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Cloud server routing and WebSocket message dispatch latency</span>
            </li>
          </ul>
          <p className="text-xs text-slate-400 pt-1 leading-relaxed font-sans">
            The application is not certified as a World Athletics or Olympic-grade transponder timing system. Hosts should independently verify critical race results before official publication.
          </p>
        </section>

        {/* 6. RACE RESULTS */}
        <section id="section-race-results" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              6. Race Results
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Hosts retain full ownership and discretion over their race results. When a Host toggles a result as published, that result becomes accessible to public viewers on the Results directory. Hosts are responsible for reviewing data accuracy prior to publishing and may unpublish or adjust results at any time.
          </p>
        </section>

        {/* 7. USER ACCOUNTS */}
        <section id="section-user-accounts" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              7. User Accounts
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Access to Host features requires an authenticated account. Hosts are solely responsible for maintaining the confidentiality of their credentials and for all activities that occur under their authenticated sessions.
          </p>
        </section>

        {/* 8. QR CODES AND JOIN CODES */}
        <section id="section-qr-join-codes" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              8. QR Codes and Join Codes
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Checkpoint Join Codes and QR Codes are issued specifically to connect authorized field marshals to a timing gate. Users must not share, distribute, or misuse codes to gain unauthorized access to race sessions.
          </p>
        </section>

        {/* 9. ACCEPTABLE USE */}
        <section id="section-acceptable-use" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              9. Acceptable Use
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            You agree not to engage in any prohibited activities, including:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Attempting unauthorized access to other users' race accounts or private dashboards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Circumventing authentication mechanisms, tokens, or database security rules.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Interfering with server-authoritative clock synchronization or WebSocket streams.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Submitting intentionally fabricated or defamatory runner records.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Automated scraping, denial-of-service attempts, or disruptive automated queries.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span>Using the application for any unlawful or unauthorized purposes.</span>
            </li>
          </ul>
        </section>

        {/* 10. DATA AND CONTENT */}
        <section id="section-data-content" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              10. Data and Content
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Hosts and users are solely responsible for all information entered into the service, including runner identifiers, event titles, gate descriptions, and split notes. You represent that you have the right to input and process any personal or athletic data provided.
          </p>
        </section>

        {/* 11. PUBLIC RESULTS */}
        <section id="section-public-results-terms" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              11. Public Results
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            When a Host elects to publish a race result, the contained metrics (including runner name, event title, timestamps, split paces, and speed profiles) become accessible to the public. Hosts must ensure they have received proper consent from participants before publishing public records.
          </p>
        </section>

        {/* 12. SERVICE AVAILABILITY */}
        <section id="section-availability" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              12. Service Availability
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            While we strive for continuous operation, Runner Stopwatch may occasionally experience downtime or degraded performance due to scheduled maintenance, cloud infrastructure outages, telecommunication carrier failures, or browser compatibility constraints. We do not guarantee uninterrupted 100% uptime.
          </p>
        </section>

        {/* 13. THIRD-PARTY SERVICES */}
        <section id="section-third-party-terms" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              13. Third-Party Services
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch depends on cloud infrastructure provided by Google Cloud and Firebase for database storage, authentication, and WebSocket messaging. Service availability and data handling are subject to the operational terms of these underlying service providers.
          </p>
        </section>

        {/* 14. INTELLECTUAL PROPERTY */}
        <section id="section-intellectual-property" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Copyright className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              14. Intellectual Property
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            The Runner Stopwatch name, design system, user interface, software algorithms, and visual branding are protected intellectual property. Usage of the service grants a limited, non-exclusive license to use the platform as intended; it does not convey ownership of the underlying software or brand assets.
          </p>
        </section>

        {/* 15. DISCLAIMER */}
        <section id="section-disclaimer" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              15. Disclaimer
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Runner Stopwatch is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. We do not warrant that the timing calculations, synchronization accuracy, or generated certificates will be completely error-free or suitable for official athletic record certification.
          </p>
        </section>

        {/* 16. LIMITATION OF LIABILITY */}
        <section id="section-limitation-liability" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              16. Limitation of Liability
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            To the maximum extent permitted by applicable law, Runner Stopwatch and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from inaccurate user data, device battery depletion, field operator error, wireless connection dropouts, cloud service interruptions, or reliance on recorded race splits.
          </p>
        </section>

        {/* 17. TERMINATION */}
        <section id="section-termination" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <PowerOff className="w-5 h-5 text-rose-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              17. Termination
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            We reserve the right to restrict, suspend, or terminate access to the service at our sole discretion, without prior notice, in cases of security threats, severe system abuse, deliberate timing interference, or violation of these Terms.
          </p>
        </section>

        {/* 18. CHANGES TO THESE TERMS */}
        <section id="section-changes-terms" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              18. Changes to These Terms
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            We may revise these Terms of Service periodically. Any modifications will be posted directly to this page. Continued usage of the application following any changes constitutes acceptance of the updated terms.
          </p>
        </section>

        {/* 19. CONTACT */}
        <section id="section-contact-terms" className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-sans tracking-tight">
              19. Contact
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            For questions regarding these Terms of Service, please contact:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <a 
              href="mailto:support@mohandagar.in"
              id="terms-contact-email"
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
          id="terms-of-service-back-bottom"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-all text-xs font-bold w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

    </div>
  );
};
