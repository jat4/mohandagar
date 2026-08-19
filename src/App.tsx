/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProjectsSection } from './components/ProjectsSection';
import { TechStackSection } from './components/TechStackSection';
import { ExperienceSection } from './components/ExperienceSection';
import { CnameGuideSection } from './components/CnameGuideSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { TerminalModal } from './components/TerminalModal';
import { DeployTroubleshooterModal } from './components/DeployTroubleshooterModal';

export default function App() {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);

  const handleOpenTerminal = () => setTerminalOpen(true);
  const handleCloseTerminal = () => setTerminalOpen(false);

  const handleOpenDeployModal = () => setDeployModalOpen(true);
  const handleCloseDeployModal = () => setDeployModalOpen(false);

  const handleOpenCnameGuide = () => {
    const el = document.getElementById('cname-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 antialiased">
      {/* Navigation Header */}
      <Navbar 
        onOpenTerminal={handleOpenTerminal} 
        onOpenCnameGuide={handleOpenCnameGuide}
        onOpenDeployTroubleshooter={handleOpenDeployModal} 
      />

      {/* Main Sections */}
      <main>
        <Hero 
          onOpenTerminal={handleOpenTerminal} 
          onOpenCnameGuide={handleOpenCnameGuide}
          onOpenDeployTroubleshooter={handleOpenDeployModal} 
        />
        
        <ProjectsSection />
        
        <TechStackSection />
        
        <ExperienceSection />
        
        <CnameGuideSection />
        
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

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
