import React, { useState, useEffect } from 'react';
import { PERSONAL_INFO } from '../data/portfolioData';
import { 
  Github, 
  ArrowRight, 
  Terminal, 
  Globe, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  Code2,
  Rocket,
  AlertCircle
} from 'lucide-react';

interface HeroProps {
  onOpenTerminal: () => void;
  onOpenCnameGuide: () => void;
  onOpenDeployTroubleshooter: () => void;
}

const ROLES = [
  'Full Stack Software Engineer',
  'Cloud Systems & DevOps Builder',
  'Open Source Creator (@mohandagar)',
  'TypeScript & React Specialist'
];

export const Hero: React.FC<HeroProps> = ({ 
  onOpenTerminal, 
  onOpenCnameGuide,
  onOpenDeployTroubleshooter 
}) => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % ROLES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(PERSONAL_INFO.domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  return (
    <section id="about" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Main Hero Content */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            {/* Live Domain & GitHub Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-6 shadow-sm shadow-cyan-950/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-slate-300">CNAME target:</span>
              <span className="font-semibold text-cyan-300">{PERSONAL_INFO.domain}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">GitHub: @{PERSONAL_INFO.githubUsername}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-[1.1] mb-4">
              Building modern web apps & scalable systems.
            </h1>

            {/* Dynamic Role Subtitle */}
            <div className="h-10 flex items-center mb-6">
              <span className="text-lg sm:text-xl font-medium text-slate-400 mr-2">I am a</span>
              <span className="text-lg sm:text-xl font-mono font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 transition-all duration-500">
                {ROLES[roleIndex]}
              </span>
            </div>

            {/* Bio Paragraph */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
              {PERSONAL_INFO.tagline} Welcome to my official home on the web at <strong className="text-cyan-300 font-semibold">{PERSONAL_INFO.domain}</strong>, synced continuously with my open-source work on GitHub.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto mb-10">
              <a
                id="hero-explore-projects-btn"
                href="#projects"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all w-full sm:w-auto"
              >
                <span>Explore GitHub Repos</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                id="hero-deploy-assistant-btn"
                onClick={onOpenDeployTroubleshooter}
                type="button"
                className="px-5 py-3.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer shadow-md shadow-cyan-950/50"
              >
                <Rocket className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Deploy to mohandagar.in</span>
              </button>

              <button
                id="hero-cname-setup-btn"
                onClick={onOpenCnameGuide}
                type="button"
                className="px-4 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>DNS Config</span>
              </button>

              <button
                id="hero-terminal-btn"
                onClick={onOpenTerminal}
                type="button"
                className="px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-300 text-sm font-mono flex items-center justify-center gap-2 transition-all w-full sm:w-auto cursor-pointer"
                title="Launch Interactive Terminal"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>CLI</span>
              </button>
            </div>

            {/* Domain Copy Quick Bar */}
            <div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800 max-w-md w-full">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50"></div>
              <div className="flex-1 font-mono text-xs text-slate-300 truncate">
                CNAME <span className="text-cyan-300 font-bold">{PERSONAL_INFO.domain}</span>
              </div>
              <button
                onClick={handleCopyDomain}
                type="button"
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy CNAME Domain"
              >
                {copiedDomain ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Interactive Developer Card / Live Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-1 shadow-2xl shadow-black/60 overflow-hidden">
              {/* Window Bar */}
              <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs text-slate-400 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    mohandagar.in ~ config
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>CNAME Active</span>
                </div>
              </div>

              {/* Code / Profile Body */}
              <div className="p-5 font-mono text-xs sm:text-sm text-slate-300 space-y-3 bg-slate-950/40">
                <div>
                  <span className="text-purple-400">const</span> <span className="text-blue-300">developer</span> = &#123;
                </div>
                <div className="pl-4 space-y-1 text-slate-300">
                  <div>
                    <span className="text-cyan-400">name</span>: <span className="text-emerald-300">"{PERSONAL_INFO.name}"</span>,
                  </div>
                  <div>
                    <span className="text-cyan-400">domain</span>: <span className="text-emerald-300">"{PERSONAL_INFO.domain}"</span>,
                  </div>
                  <div>
                    <span className="text-cyan-400">github</span>: <a href={PERSONAL_INFO.githubProfileUrl} target="_blank" rel="noreferrer" className="text-cyan-300 underline hover:text-cyan-200">"github.com/{PERSONAL_INFO.githubUsername}"</a>,
                  </div>
                  <div>
                    <span className="text-cyan-400">email</span>: <span className="text-emerald-300">"{PERSONAL_INFO.email}"</span>,
                  </div>
                  <div>
                    <span className="text-cyan-400">cnameFile</span>: <span className="text-amber-300">"/public/CNAME"</span>,
                  </div>
                  <div>
                    <span className="text-cyan-400">techStack</span>: [
                    <span className="text-amber-200">"React"</span>, <span className="text-amber-200">"TypeScript"</span>, <span className="text-amber-200">"Node.js"</span>, <span className="text-amber-200">"Cloud"</span>
                    ],
                  </div>
                  <div>
                    <span className="text-cyan-400">status</span>: <span className="text-emerald-300">"🟢 Open for Opportunities"</span>
                  </div>
                </div>
                <div>&#125;;</div>

                {/* Live Console Output Box */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs">
                  <div className="text-slate-500">// Terminal Quick Action</div>
                  <div className="flex items-center justify-between mt-1 text-slate-400 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-mono text-cyan-300">$ curl -I https://mohandagar.in</span>
                    <span className="text-emerald-400 font-semibold">HTTP 200 OK</span>
                  </div>
                </div>
              </div>

              {/* Stats Footer inside Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/80 border-t border-slate-800 text-center">
                {PERSONAL_INFO.stats.map((stat) => (
                  <div key={stat.label} className="p-2 rounded-lg bg-slate-900/50">
                    <div className="font-bold text-slate-100 text-sm sm:text-base font-mono text-cyan-300">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
