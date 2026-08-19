import React, { useState } from 'react';
import { PERSONAL_INFO, DNS_CONFIG_RECORDS } from '../data/portfolioData';
import { 
  Globe, 
  Copy, 
  Check, 
  Server, 
  ShieldCheck, 
  FileCode2, 
  Terminal, 
  Download, 
  ExternalLink,
  Info,
  CheckCircle2,
  Sparkles,
  GitBranch
} from 'lucide-react';

export const CnameGuideSection: React.FC = () => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dns' | 'cname' | 'workflow' | 'steps'>('dns');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const workflowYaml = `name: Deploy mohandagar.in to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install Dependencies
        run: npm install

      - name: Build Production Bundle
        run: npm run build

      - name: Ensure CNAME File in dist/
        run: echo "${PERSONAL_INFO.domain}" > dist/CNAME

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  return (
    <section id="cname-guide" className="py-20 md:py-28 relative bg-slate-900/40 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono text-cyan-300 mb-3.5 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Domain & CNAME Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Publishing to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">mohandagar.in</span>
          </h2>
          <p className="text-slate-400 mt-2 text-base leading-relaxed">
            Complete technical configuration to deploy the GitHub repository <strong className="text-slate-200">github.com/{PERSONAL_INFO.githubUsername}/{PERSONAL_INFO.githubUsername}</strong> to your custom domain <strong className="text-cyan-300">mohandagar.in</strong> with automated HTTPS SSL certificates and GitHub Actions.
          </p>
        </div>

        {/* Status Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">Target Domain</div>
              <div className="text-base font-bold text-slate-100">{PERSONAL_INFO.domain}</div>
              <div className="text-[11px] text-cyan-400/90 font-mono mt-0.5">CNAME in /public/CNAME</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">GitHub Repo Source</div>
              <div className="text-base font-bold text-slate-100">{PERSONAL_INFO.githubUsername}/{PERSONAL_INFO.githubUsername}</div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">Branch: main (dist build)</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">SSL / HTTPS Enforced</div>
              <div className="text-base font-bold text-emerald-300">Free Automatic SSL</div>
              <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">GitHub Let's Encrypt CA</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
          {[
            { id: 'dns', label: '1. DNS Records Setup' },
            { id: 'cname', label: '2. CNAME File' },
            { id: 'workflow', label: '3. GitHub Actions Workflow' },
            { id: 'steps', label: '4. Step-by-Step Guide' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
              className={`px-5 py-3 text-xs sm:text-sm font-mono font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: DNS Records */}
        {activeTab === 'dns' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-300">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Add these 5 DNS records in your domain registrar's DNS management console (e.g. Cloudflare, GoDaddy, Namecheap, Hostinger) for <strong>mohandagar.in</strong>:
              </span>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Record Type</th>
                      <th className="py-3 px-4">Host / Name</th>
                      <th className="py-3 px-4">Points To / Value</th>
                      <th className="py-3 px-4">TTL</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {DNS_CONFIG_RECORDS.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            rec.type === 'A' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}>
                            {rec.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200">{rec.host}</td>
                        <td className="py-3 px-4 text-cyan-300 select-all font-semibold">{rec.value}</td>
                        <td className="py-3 px-4 text-slate-400">{rec.ttl}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{rec.purpose}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => copyToClipboard(rec.value, `dns-${i}`)}
                            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                            title="Copy Value"
                          >
                            {copiedType === `dns-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CNAME File */}
        {activeTab === 'cname' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                Location: <strong className="text-slate-200">/public/CNAME</strong> or <strong className="text-slate-200">/CNAME</strong>
              </span>
              <button
                onClick={() => copyToClipboard(PERSONAL_INFO.domain, 'cname-content')}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 hover:bg-cyan-900/60 transition-colors"
              >
                {copiedType === 'cname-content' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy CNAME Content</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm text-cyan-300">
              {PERSONAL_INFO.domain}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When Vite builds the application, any file in the <code className="text-cyan-400">/public</code> folder is placed directly at the root of the output directory (<code className="text-cyan-400">/dist/CNAME</code>). GitHub Pages automatically reads this file to route all web traffic from <strong>mohandagar.in</strong>.
            </p>
          </div>
        )}

        {/* Tab 3: GitHub Actions Workflow */}
        {activeTab === 'workflow' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                File: <strong className="text-slate-200">.github/workflows/deploy.yml</strong>
              </span>
              <button
                onClick={() => copyToClipboard(workflowYaml, 'workflow-yaml')}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 hover:bg-cyan-900/60 transition-colors"
              >
                {copiedType === 'workflow-yaml' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Workflow YAML</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy GitHub Actions YAML</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-96">
              <pre>{workflowYaml}</pre>
            </div>
          </div>
        )}

        {/* Tab 4: Step-by-Step Guide */}
        {activeTab === 'steps' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300">1</span>
                <span>Push Code to GitHub</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Commit and push this codebase to your repository <code className="text-slate-200">github.com/{PERSONAL_INFO.githubUsername}/mohandagar</code> on the <code className="text-cyan-400">main</code> branch.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300">2</span>
                <span>Configure GitHub Pages Source</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Go to GitHub Repo &rarr; <strong>Settings</strong> &rarr; <strong>Pages</strong> &rarr; Build and deployment: Select <strong>GitHub Actions</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300">3</span>
                <span>Set Custom Domain in GitHub</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Under "Custom domain", enter <strong className="text-cyan-300">{PERSONAL_INFO.domain}</strong> and click Save. GitHub will verify the DNS records.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-300">4</span>
                <span>Enforce HTTPS & Live</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check <strong>"Enforce HTTPS"</strong>. Your website will be live at <a href="https://mohandagar.in" target="_blank" rel="noreferrer" className="text-cyan-400 underline">https://mohandagar.in</a> with full green SSL!
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
