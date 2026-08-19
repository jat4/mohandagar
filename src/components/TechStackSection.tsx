import React, { useState } from 'react';
import { SKILL_ITEMS } from '../data/portfolioData';
import { 
  Code2, 
  Layers, 
  Cpu, 
  Server, 
  Box, 
  Database, 
  Wrench, 
  Flame, 
  CheckCircle,
  Terminal,
  Zap
} from 'lucide-react';

export const TechStackSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Languages', 'Frontend', 'Backend', 'DevOps & Cloud', 'Databases & Tools'];

  const filteredSkills = selectedCategory === 'All' 
    ? SKILL_ITEMS 
    : SKILL_ITEMS.filter(s => s.category === selectedCategory);

  return (
    <section id="skills" className="py-20 md:py-28 relative bg-slate-950/60 border-t border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Core Competencies & Tooling</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Technical Stack & Engineering Arsenal
          </h2>
          <p className="text-slate-400 mt-3 text-base">
            Modern technologies, frameworks, and cloud paradigms I use to build performant, resilient web solutions.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-medium font-mono transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {filteredSkills.map((skill) => (
            <div
              key={skill.name}
              className="group p-4.5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-200 text-sm group-hover:text-cyan-300 transition-colors">
                    {skill.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {skill.yearsOfExp}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mb-3">
                  {skill.category}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                  <span>Proficiency</span>
                  <span className="text-cyan-400 font-semibold">{skill.level}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Engineering Philosophy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Performance & Speed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Optimizing critical rendering paths, leveraging zero-copy server patterns, and maintaining high Lighthouse performance benchmarks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Type Safety & Robustness</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict TypeScript configurations, complete schema validation with Zod/io-ts, and automated test coverage across services.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Cloud & CI/CD Automation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated container orchestration, declarative GitHub Actions workflows, custom CNAME routing, and zero-downtime releases.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
