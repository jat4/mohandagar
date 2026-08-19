import React, { useState, useEffect } from 'react';
import { PERSONAL_INFO } from '../data/portfolioData';
import { 
  Github, 
  Terminal, 
  Globe, 
  Menu, 
  X, 
  ExternalLink,
  Code2,
  Sparkles,
  Rocket,
  Timer,
  Activity
} from 'lucide-react';

interface NavbarProps {
  onOpenTerminal: () => void;
  onOpenCnameGuide: () => void;
  onOpenDeployTroubleshooter: () => void;
  onOpenRaceTiming: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenTerminal, 
  onOpenCnameGuide,
  onOpenDeployTroubleshooter,
  onOpenRaceTiming
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Experience', href: '#experience' },
    { name: 'Guestbook', href: '#guestbook' },
    { name: 'CNAME Setup', href: '#cname-guide' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header 
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/40 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Domain */}
          <a 
            id="brand-logo"
            href="#" 
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <span className="font-mono font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  MD
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-100 tracking-tight text-base group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                {PERSONAL_INFO.name}
              </span>
              <span className="font-mono text-xs text-cyan-400/90 flex items-center gap-1">
                <Globe className="w-3 h-3 inline text-cyan-400" />
                {PERSONAL_INFO.domain}
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                id={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                href={link.href}
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            <button
              id="race-timing-nav-btn"
              onClick={onOpenRaceTiming}
              type="button"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              title="Multi-Checkpoint Runner Stopwatch & Timing System"
            >
              <Timer className="w-3.5 h-3.5 fill-slate-950" />
              <span>Race Timer</span>
            </button>

            <button
              id="deploy-helper-nav-btn"
              onClick={onOpenDeployTroubleshooter}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Deploy Troubleshooter & GitHub Steps"
            >
              <Rocket className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span>Deploy Guide</span>
            </button>

            <button
              id="terminal-toggle-btn"
              onClick={onOpenTerminal}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              title="Open Interactive Developer CLI"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLI</span>
            </button>

            <a
              id="github-nav-btn"
              href={PERSONAL_INFO.githubProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-sm font-medium flex items-center gap-2 transition-all"
            >
              <Github className="w-4 h-4 text-slate-200" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-deploy-btn"
              onClick={onOpenDeployTroubleshooter}
              type="button"
              className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
              aria-label="Deploy Assistant"
            >
              <Rocket className="w-4 h-4" />
            </button>
            <button
              id="mobile-terminal-btn"
              onClick={onOpenTerminal}
              type="button"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400"
              aria-label="Open Terminal"
            >
              <Terminal className="w-4 h-4" />
            </button>
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-2 border-t border-slate-800/80 bg-slate-950/95 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRaceTiming();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-2"
                >
                  <Timer className="w-4 h-4" />
                  <span>Multi-Checkpoint Race Stopwatch</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDeployTroubleshooter();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-cyan-950/60 text-cyan-300 text-xs font-mono flex items-center gap-2 border border-cyan-500/30"
                >
                  <Rocket className="w-4 h-4 text-cyan-400" />
                  <span>Deploy Assistant (mohandagar.in Fix)</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCnameGuide();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 text-slate-300 text-xs font-mono flex items-center gap-2"
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>CNAME Guide: mohandagar.in</span>
                </button>
                <a
                  href={PERSONAL_INFO.githubProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span>View GitHub (@mohandagar)</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
