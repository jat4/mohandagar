import React, { useState } from 'react';
import { PERSONAL_INFO, DNS_CONFIG_RECORDS } from '../data/portfolioData';
import { 
  Rocket, 
  X, 
  Check, 
  Copy, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Github, 
  Terminal, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface DeployTroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployTroubleshooterModal: React.FC<DeployTroubleshooterModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const gitPushCommand = `git init
git add .
git commit -m "Deploy mohandagar.in portfolio"
git branch -M main
git remote add origin https://github.com/mohandagar/mohandagar.git
git push -u origin main --force`;

  const npmDeployCommand = `npm run build
npm run deploy`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl shadow-cyan-950/50 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Deploy Assistant: <strong className="text-cyan-300">mohandagar.in</strong></span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Kyu deploy nahi hui? Check these 4 essential steps.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans text-sm">
          
          {/* Quick Notice */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300 font-semibold">Deploy hone ke liye 2 cheezein zaroori hain:</strong>
              <ol className="list-decimal pl-4 mt-1.5 space-y-1 text-slate-300">
                <li>Ye code aapke GitHub repository (<strong>github.com/mohandagar/mohandagar</strong>) pe push hona chahiye.</li>
                <li>Aapke domain registrar (GoDaddy, Cloudflare, etc.) me <strong>mohandagar.in</strong> ke DNS Records GitHub Pages ki taraf point hone chahiye.</li>
              </ol>
            </div>
          </div>

          {/* 4 Steps Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Step-by-Step Fix (Complete Deployment Pipeline)
            </h4>

            {/* Step 1: Push Code to GitHub */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">1</span>
                  <span className="font-bold text-slate-200">Code ko GitHub Repository pe Push Karein</span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                AI Studio se code ko apne GitHub account pe sync karne ke liye terminal me ye command chalayein:
              </p>
              
              <div className="relative">
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                  {gitPushCommand}
                </pre>
                <button
                  onClick={() => copyText(gitPushCommand, 'git-push')}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedKey === 'git-push' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-400">
                <em>Option 2:</em> AI Studio ke top-right <strong>Settings &rarr; Export to GitHub</strong> ya <strong>Download ZIP</strong> use karke bhi push kar sakte hain.
              </div>
            </div>

            {/* Step 2: GitHub Pages Settings */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">2</span>
                  <span className="font-bold text-slate-200">GitHub Repository me Pages Enable Karein</span>
                </div>
                <a
                  href={`https://github.com/${PERSONAL_INFO.githubUsername}/${PERSONAL_INFO.githubUsername}/settings/pages`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                >
                  <span>Open Repo Pages</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
                <li>Apne repo <a href={`https://github.com/${PERSONAL_INFO.githubUsername}/${PERSONAL_INFO.githubUsername}`} target="_blank" rel="noreferrer" className="text-cyan-300 underline">github.com/{PERSONAL_INFO.githubUsername}/{PERSONAL_INFO.githubUsername}</a> ke <strong>Settings &rarr; Pages</strong> me jayein.</li>
                <li><strong>Build and deployment Source</strong>: <strong>GitHub Actions</strong> select karein (kyunki humne <code className="text-cyan-300">.github/workflows/deploy.yml</code> add kar diya hai).</li>
                <li><strong>Custom domain</strong> me <strong className="text-cyan-300">mohandagar.in</strong> likh kar Save karein.</li>
                <li><strong>Enforce HTTPS</strong> checkbox ko check karein.</li>
              </ul>
            </div>

            {/* Step 3: DNS Records Configuration */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">3</span>
                  <span className="font-bold text-slate-200">DNS Records (GoDaddy / Cloudflare / Namecheap)</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                  Critical
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Jahan se aapne <strong>mohandagar.in</strong> khareeda hai, wahan DNS Management me ye records add karein:
              </p>

              <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Type</th>
                      <th className="p-2">Name / Host</th>
                      <th className="p-2">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2 text-cyan-400 font-bold">A</td>
                      <td className="p-2">@</td>
                      <td className="p-2 text-emerald-300">185.199.108.153</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-cyan-400 font-bold">A</td>
                      <td className="p-2">@</td>
                      <td className="p-2 text-emerald-300">185.199.109.153</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-cyan-400 font-bold">A</td>
                      <td className="p-2">@</td>
                      <td className="p-2 text-emerald-300">185.199.110.153</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-cyan-400 font-bold">A</td>
                      <td className="p-2">@</td>
                      <td className="p-2 text-emerald-300">185.199.111.153</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-purple-400 font-bold">CNAME</td>
                      <td className="p-2">www</td>
                      <td className="p-2 text-cyan-300">{PERSONAL_INFO.githubUsername}.github.io</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 4: DNS Propagation & SSL Generation Time */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold">4</span>
                <span className="font-bold text-slate-200">DNS Propagation Time (Wait 5-15 mins)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                DNS add karne ke baad global propagation me <strong>5 se 15 minute</strong> lagte hain. Iske baad GitHub Pages automatically Let's Encrypt SSL certificate issue karke <strong className="text-cyan-300">https://mohandagar.in</strong> ko live kar deta hai.
              </p>
            </div>

          </div>

          {/* Quick Terminal Test Command */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-400">
              <span className="text-cyan-300">$</span> Check if DNS is live: <code className="text-slate-200">nslookup mohandagar.in</code>
            </div>
            <a
              href="https://mohandagar.in"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <span>Visit mohandagar.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            CNAME file: <code className="text-cyan-300">/public/CNAME</code> (Created)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
