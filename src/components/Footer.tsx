import React from 'react';
import { PERSONAL_INFO } from '../data/portfolioData';
import { Github, Globe, ArrowUp, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-12 bg-slate-950 border-t border-slate-900 text-slate-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand & CNAME indicator */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-sm">
                MD
              </div>
              <span className="font-bold text-slate-200 text-sm">
                {PERSONAL_INFO.name}
              </span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-cyan-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CNAME: {PERSONAL_INFO.domain}</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <a href="#about" className="hover:text-cyan-300 transition-colors">About</a>
            <a href="#projects" className="hover:text-cyan-300 transition-colors">Projects</a>
            <a href="#skills" className="hover:text-cyan-300 transition-colors">Tech Stack</a>
            <a href="#cname-guide" className="hover:text-cyan-300 transition-colors">CNAME Setup</a>
            <a href="#contact" className="hover:text-cyan-300 transition-colors">Contact</a>
            <a 
              href={PERSONAL_INFO.githubProfileUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            type="button"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Back to Top"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-900 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} {PERSONAL_INFO.name}. Hosted on GitHub Pages with CNAME <span className="text-cyan-400">{PERSONAL_INFO.domain}</span>.
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            Engineered with React 19 & Tailwind CSS
          </div>
        </div>

      </div>
    </footer>
  );
};
