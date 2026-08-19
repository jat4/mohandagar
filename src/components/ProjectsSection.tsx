import React, { useState, useEffect, useMemo } from 'react';
import { GitHubRepo, FeaturedProject } from '../types';
import { FEATURED_PROJECTS, PERSONAL_INFO } from '../data/portfolioData';
import { fetchGitHubRepos } from '../services/githubService';
import { 
  Github, 
  ExternalLink, 
  Star, 
  GitFork, 
  Search, 
  RotateCw, 
  Code2, 
  Radio,
  Sparkles,
  Layers,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';

export const ProjectsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'Full-Stack' | 'DevOps & Tools' | 'AI & ML'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadRepos = async () => {
    setLoading(true);
    const result = await fetchGitHubRepos();
    setRepos(result.repos);
    setIsLive(result.isLive);
    setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  };

  useEffect(() => {
    loadRepos();
  }, []);

  // Filtered list based on search and tab
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      const matchesSearch = 
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (repo.language && repo.language.toLowerCase().includes(searchQuery.toLowerCase())) ||
        repo.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'featured') return repo.pinned || repo.stargazers_count > 50 || repo.name === 'mohandagar';
      
      // Match category keywords
      const lowerTopics = (repo.topics || []).map(t => t.toLowerCase()).join(' ') + ' ' + (repo.description || '').toLowerCase();
      if (activeTab === 'Full-Stack') return lowerTopics.includes('full-stack') || lowerTopics.includes('react') || lowerTopics.includes('typescript') || lowerTopics.includes('portfolio');
      if (activeTab === 'DevOps & Tools') return lowerTopics.includes('docker') || lowerTopics.includes('kubernetes') || lowerTopics.includes('cli') || lowerTopics.includes('tools') || lowerTopics.includes('cname');
      if (activeTab === 'AI & ML') return lowerTopics.includes('ai') || lowerTopics.includes('prompt') || lowerTopics.includes('llm');

      return true;
    });
  }, [repos, searchQuery, activeTab]);

  return (
    <section id="projects" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-xs font-mono text-cyan-300 mb-3">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>GitHub Repositories & Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              Open Source & Featured Work
            </h2>
            <p className="text-slate-400 mt-2 text-base max-w-2xl">
              Live repositories fetched directly from <a href={PERSONAL_INFO.githubProfileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">github.com/{PERSONAL_INFO.githubUsername}</a>, showcasing applications, systems, and developer tools.
            </p>
          </div>

          {/* Sync Status Badge & Refresh */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isLive ? 'Live GitHub Sync' : 'Static Cache'}</span>
              {lastRefreshed && <span className="text-slate-600">({lastRefreshed})</span>}
            </div>

            <button
              id="refresh-repos-btn"
              onClick={loadRepos}
              disabled={loading}
              type="button"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh GitHub Repositories"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Featured Hero Project Highlight (mohandagar & nexus) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {FEATURED_PROJECTS.slice(0, 2).map((project) => (
            <div 
              key={project.id}
              className="group relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 hover:border-cyan-500/50 p-6 sm:p-7 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    {project.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    {project.stars && (
                      <span className="flex items-center gap-1 text-amber-400/90">
                        <Star className="w-3.5 h-3.5 fill-amber-400/30" />
                        {project.stars}
                      </span>
                    )}
                    {project.forks && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <GitFork className="w-3.5 h-3.5" />
                        {project.forks}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-cyan-400/90 font-mono mb-3">
                  {project.tagline}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">
                  {project.description}
                </p>

                {/* Key Features List */}
                <div className="space-y-1.5 mb-6">
                  {project.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {/* Tech Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {project.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-300 text-xs font-mono border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>View Repository</span>
                  </a>
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <span>Live Site / CNAME</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(['all', 'featured', 'Full-Stack', 'DevOps & Tools', 'AI & ML'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab === 'all' ? 'All Repositories' : tab === 'featured' ? '★ Pinned' : tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="repo-search-input"
              type="text"
              placeholder="Search repos, tags, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Repositories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-48 rounded-xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-5" />
            ))}
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800/80">
            <Code2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No repositories found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or switching categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepos.map((repo) => {
              const isSpecial = repo.name === 'mohandagar';
              return (
                <div
                  key={repo.id}
                  className={`group relative rounded-xl bg-slate-900/70 border ${
                    isSpecial ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-slate-900/80' : 'border-slate-800'
                  } hover:border-cyan-500/40 p-5 transition-all duration-200 flex flex-col justify-between shadow-md hover:shadow-cyan-500/5`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        <h4 className="font-mono font-bold text-sm text-slate-200 group-hover:text-cyan-300 transition-colors truncate max-w-[180px]">
                          {repo.name}
                        </h4>
                      </div>
                      {isSpecial && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-semibold">
                          CNAME REPO
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                      {repo.description || 'Open source software component maintained by Mohan Dagar.'}
                    </p>
                  </div>

                  <div>
                    {/* Topics / Tags */}
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {repo.topics.slice(0, 3).map((topic) => (
                          <span key={topic} className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-mono text-slate-400">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        {repo.language && (
                          <span className="flex items-center gap-1 text-slate-300 text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-amber-400/90 text-[11px]">
                          <Star className="w-3 h-3 fill-amber-400/20" />
                          {repo.stargazers_count}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {repo.homepage && (
                          <a
                            href={repo.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-cyan-300 p-1 rounded transition-colors"
                            title="Live Demo"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                          title="View on GitHub"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View all on GitHub banner */}
        <div className="mt-12 text-center">
          <a
            href={PERSONAL_INFO.githubProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white text-sm font-medium transition-all group"
          >
            <Github className="w-4 h-4 text-slate-300 group-hover:text-cyan-400" />
            <span>View All Repositories on GitHub (@{PERSONAL_INFO.githubUsername})</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </a>
        </div>

      </div>
    </section>
  );
};
