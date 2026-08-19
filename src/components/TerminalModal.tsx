import React, { useState, useRef, useEffect } from 'react';
import { PERSONAL_INFO, FEATURED_PROJECTS, SKILL_ITEMS, DNS_CONFIG_RECORDS } from '../data/portfolioData';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Sparkles, CornerDownLeft } from 'lucide-react';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandHistoryItem {
  command: string;
  output: React.ReactNode;
  timestamp: string;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ isOpen, onClose }) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      command: 'init',
      output: (
        <div className="space-y-1 text-slate-300">
          <div className="text-cyan-400 font-bold">
            Mohan Dagar Shell [v2.4.0-release] — Connected to mohandagar.in
          </div>
          <div className="text-slate-400 text-xs">
            Type <span className="text-cyan-300 font-semibold">help</span> to view available CLI commands or try <span className="text-cyan-300 font-semibold">cname</span>, <span className="text-cyan-300 font-semibold">projects</span>, <span className="text-cyan-300 font-semibold">skills</span>.
          </div>
        </div>
      ),
      timestamp: '12:00:00'
    }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();
    const now = new Date().toLocaleTimeString();
    let output: React.ReactNode = null;

    switch (lower) {
      case 'help':
        output = (
          <div className="space-y-1.5 text-xs font-mono">
            <div className="text-cyan-300 font-bold mb-1">Available Commands:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
              <div><span className="text-amber-400 font-semibold">whoami</span> - Display developer bio & role</div>
              <div><span className="text-amber-400 font-semibold">cname</span> - Verify mohandagar.in DNS configuration</div>
              <div><span className="text-amber-400 font-semibold">projects</span> - List highlighted GitHub repositories</div>
              <div><span className="text-amber-400 font-semibold">skills</span> - Inspect core engineering tech stack</div>
              <div><span className="text-amber-400 font-semibold">github</span> - View GitHub profile statistics</div>
              <div><span className="text-amber-400 font-semibold">contact</span> - Get direct email & social links</div>
              <div><span className="text-amber-400 font-semibold">clear</span> - Reset terminal screen</div>
              <div><span className="text-amber-400 font-semibold">date</span> - Print system timestamp</div>
            </div>
          </div>
        );
        break;

      case 'whoami':
      case 'about':
        output = (
          <div className="text-xs text-slate-300 space-y-1">
            <div className="text-cyan-300 font-bold">{PERSONAL_INFO.name}</div>
            <div>{PERSONAL_INFO.title}</div>
            <div className="text-slate-400">{PERSONAL_INFO.bio}</div>
            <div className="text-emerald-400 font-mono pt-1">Target Host: https://{PERSONAL_INFO.domain}</div>
          </div>
        );
        break;

      case 'cname':
      case 'domain':
      case 'dns':
        output = (
          <div className="text-xs font-mono space-y-2">
            <div className="text-cyan-300 font-bold">CNAME & DNS Configuration for mohandagar.in:</div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
              <div>Domain: <span className="text-emerald-400">{PERSONAL_INFO.domain}</span></div>
              <div>File: <span className="text-amber-300">/public/CNAME</span> [mohandagar.in]</div>
              <div>Apex A-Records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153</div>
              <div>Subdomain CNAME: www &rarr; {PERSONAL_INFO.githubUsername}.github.io</div>
              <div>SSL Certificate: Active (Automatic HTTPS via Let's Encrypt)</div>
            </div>
          </div>
        );
        break;

      case 'projects':
      case 'repos':
        output = (
          <div className="text-xs font-mono space-y-2">
            <div className="text-cyan-300 font-bold">Featured GitHub Repositories:</div>
            {FEATURED_PROJECTS.slice(0, 4).map((p) => (
              <div key={p.id} className="border-l-2 border-cyan-500/50 pl-2">
                <a href={p.repoUrl} target="_blank" rel="noreferrer" className="text-slate-200 font-bold hover:text-cyan-300 underline">
                  {p.title}
                </a>
                <div className="text-slate-400 text-[11px]">{p.description}</div>
                <div className="text-cyan-400/80 text-[10px]">Tags: {p.tags.join(', ')}</div>
              </div>
            ))}
          </div>
        );
        break;

      case 'skills':
        output = (
          <div className="text-xs font-mono space-y-1">
            <div className="text-cyan-300 font-bold">Primary Tech Arsenal:</div>
            <div className="text-slate-300">
              TypeScript, React 19, Next.js, Node.js, Express, Python, Docker, Kubernetes, PostgreSQL, Redis, Tailwind CSS, Git, Vite, CNAME / DNS.
            </div>
          </div>
        );
        break;

      case 'github':
        output = (
          <div className="text-xs font-mono space-y-1">
            <div className="text-cyan-300 font-bold">GitHub Profile:</div>
            <div>Handle: <a href={PERSONAL_INFO.githubProfileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline">@{PERSONAL_INFO.githubUsername}</a></div>
            <div>Repositories: 45+ Public Repos</div>
            <div>Contributions: 1,200+ this year</div>
          </div>
        );
        break;

      case 'contact':
      case 'email':
        output = (
          <div className="text-xs font-mono space-y-1">
            <div className="text-cyan-300 font-bold">Connect with Mohan Dagar:</div>
            <div>Email: <a href={`mailto:${PERSONAL_INFO.email}`} className="text-cyan-400 underline">{PERSONAL_INFO.email}</a></div>
            <div>Domain: <a href={PERSONAL_INFO.cnameUrl} className="text-cyan-400 underline">{PERSONAL_INFO.domain}</a></div>
            <div>GitHub: <a href={PERSONAL_INFO.githubProfileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline">github.com/{PERSONAL_INFO.githubUsername}</a></div>
          </div>
        );
        break;

      case 'clear':
      case 'cls':
        setHistory([]);
        setInputVal('');
        return;

      case 'date':
        output = <div className="text-xs font-mono text-slate-300">{new Date().toString()}</div>;
        break;

      case 'sudo':
        output = <div className="text-xs font-mono text-rose-400">Permission denied: You are already the root engineer of mohandagar.in!</div>;
        break;

      default:
        output = (
          <div className="text-xs font-mono text-rose-400">
            command not found: {cmd}. Type <span className="text-cyan-300 underline cursor-pointer" onClick={() => setInputVal('help')}>help</span> for list of commands.
          </div>
        );
    }

    setHistory((prev) => [...prev, { command: cmd, output, timestamp: now }]);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div 
        className="w-full max-w-3xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col h-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors" 
              title="Close Terminal" 
            />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-xs text-slate-400 flex items-center gap-1.5">
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              mohan@mohandagar.in: ~ (zsh)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              mohandagar.in
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Logs & Output */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3 bg-slate-950/95">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-emerald-400">mohan@mohandagar.in</span>
                <span className="text-slate-500">:</span>
                <span className="text-blue-400">~</span>
                <span className="text-cyan-300">$</span>
                <span className="text-slate-100 font-semibold">{item.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto">{item.timestamp}</span>
              </div>
              <div className="pl-4 py-1 text-slate-300">{item.output}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Command Quick Chips */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <span className="text-slate-500 text-[10px] uppercase">Quick:</span>
          {['help', 'whoami', 'cname', 'projects', 'skills', 'github', 'contact', 'clear'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setInputVal(cmd);
                inputRef.current?.focus();
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 transition-colors shrink-0"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleCommand} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">mohan@mohandagar.in</span>
            <span className="text-cyan-300 font-bold">$</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type a command (e.g. 'cname', 'projects', 'help')..."
            className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none placeholder-slate-600"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-mono text-xs font-bold hover:bg-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Run</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
