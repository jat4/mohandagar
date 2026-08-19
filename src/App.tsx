/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProjectsSection } from './components/ProjectsSection';
import { TechStackSection } from './components/TechStackSection';
import { ExperienceSection } from './components/ExperienceSection';
import { GuestbookSection } from './components/GuestbookSection';
import { CnameGuideSection } from './components/CnameGuideSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { TerminalModal } from './components/TerminalModal';
import { DeployTroubleshooterModal } from './components/DeployTroubleshooterModal';
import { HostDashboard } from './components/race/HostDashboard';
import { CheckpointJoinScreen } from './components/race/CheckpointJoinScreen';
import { testConnection } from './lib/firebase';
import { Timer, Globe, Sparkles, ArrowLeft, QrCode } from 'lucide-react';

export default function App() {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'portfolio' | 'race_host' | 'race_join'>('portfolio');
  const [urlJoinCode, setUrlJoinCode] = useState<string>('');

  useEffect(() => {
    // Validate Firestore connection on boot
    testConnection().catch((err) => console.warn('Firebase initial boot check:', err));

    // Check for QR code URL search params (?join=XYZ or ?code=XYZ)
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join') || params.get('code');
    if (joinParam) {
      setUrlJoinCode(joinParam);
      setActiveView('race_join');
    }
  }, []);

  const handleOpenTerminal = () => setTerminalOpen(true);
  const handleCloseTerminal = () => setTerminalOpen(false);

  const handleOpenDeployModal = () => setDeployModalOpen(true);
  const handleCloseDeployModal = () => setDeployModalOpen(false);

  const handleOpenCnameGuide = () => {
    setActiveView('portfolio');
    setTimeout(() => {
      const el = document.getElementById('cname-guide');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased">
      
      {/* Top Application Switcher Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-300 py-2 px-4 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline text-slate-400">mohandagar.in •</span>
          <strong className="text-slate-100 font-bold">
            {activeView === 'portfolio' ? 'Developer Portfolio' : 'Multi-Checkpoint Runner Stopwatch'}
          </strong>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('portfolio')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeView === 'portfolio'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Portfolio
          </button>

          <button
            onClick={() => setActiveView('race_host')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'race_host'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
            }`}
          >
            <Timer className="w-3 h-3" />
            <span>Host Stopwatch</span>
          </button>

          <button
            onClick={() => {
              setUrlJoinCode('');
              setActiveView('race_join');
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'race_join'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <QrCode className="w-3 h-3" />
            <span>Staff Join</span>
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {activeView === 'portfolio' && (
        <>
          {/* Navigation Header */}
          <Navbar 
            onOpenTerminal={handleOpenTerminal} 
            onOpenCnameGuide={handleOpenCnameGuide}
            onOpenDeployTroubleshooter={handleOpenDeployModal} 
            onOpenRaceTiming={() => setActiveView('race_host')}
          />

          {/* Main Sections */}
          <main className="pt-16">
            <Hero 
              onOpenTerminal={handleOpenTerminal} 
              onOpenCnameGuide={handleOpenCnameGuide}
              onOpenDeployTroubleshooter={handleOpenDeployModal} 
            />
            
            <ProjectsSection />
            
            <TechStackSection />
            
            <ExperienceSection />
            
            <GuestbookSection />
            
            <CnameGuideSection />
            
            <ContactSection />
          </main>

          {/* Footer */}
          <Footer />
        </>
      )}

      {activeView === 'race_host' && (
        <main className="min-h-[calc(100vh-45px)] pb-12">
          <HostDashboard 
            onJoinByCodeClicked={() => {
              setUrlJoinCode('');
              setActiveView('race_join');
            }}
          />
        </main>
      )}

      {activeView === 'race_join' && (
        <main className="min-h-[calc(100vh-45px)]">
          <CheckpointJoinScreen 
            initialJoinCode={urlJoinCode}
            onBackToMain={() => setActiveView('race_host')}
          />
        </main>
      )}

      {/* Interactive Developer CLI / Terminal Modal */}
      <TerminalModal 
        isOpen={terminalOpen} 
        onClose={handleCloseTerminal} 
      />

      {/* Deploy Troubleshooter & GitHub Sync Modal */}
      <DeployTroubleshooterModal
        isOpen={deployModalOpen}
        onClose={handleCloseDeployModal}
      />
    </div>
  );
}
