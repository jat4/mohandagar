import { GitHubUser, GitHubRepo } from '../types';
import { PERSONAL_INFO } from '../data/portfolioData';

const GITHUB_USERNAME = PERSONAL_INFO.githubUsername;

export async function fetchGitHubProfile(): Promise<{ profile: GitHubUser; isLive: boolean }> {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}`);
    }

    const data: GitHubUser = await res.json();
    return { profile: data, isLive: true };
  } catch (err) {
    console.warn('Using fallback GitHub profile data:', err);
    return {
      profile: {
        login: GITHUB_USERNAME,
        name: PERSONAL_INFO.name,
        avatar_url: `https://github.com/${GITHUB_USERNAME}.png`,
        html_url: PERSONAL_INFO.githubProfileUrl,
        bio: PERSONAL_INFO.bio,
        public_repos: 45,
        followers: 128,
        following: 54,
        location: PERSONAL_INFO.location,
        blog: PERSONAL_INFO.cnameUrl,
        twitter_username: 'mohandagar',
        created_at: '2019-01-01T00:00:00Z',
      },
      isLive: false,
    };
  }
}

export async function fetchGitHubRepos(): Promise<{ repos: GitHubRepo[]; isLive: boolean }> {
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API returned status ${res.status}`);
    }

    const data: GitHubRepo[] = await res.json();
    return { repos: data, isLive: true };
  } catch (err) {
    console.warn('Using fallback GitHub repos data:', err);
    return {
      repos: [
        {
          id: 101,
          name: 'mohandagar',
          full_name: 'mohandagar/mohandagar',
          description: 'Official portfolio and website for mohandagar.in with custom CNAME and automated GitHub Pages workflow.',
          html_url: `https://github.com/${GITHUB_USERNAME}/mohandagar`,
          homepage: 'https://mohandagar.in',
          stargazers_count: 64,
          forks_count: 14,
          language: 'TypeScript',
          topics: ['portfolio', 'cname', 'mohandagar-in', 'react', 'tailwind'],
          updated_at: new Date().toISOString(),
          pinned: true,
        },
        {
          id: 102,
          name: 'nexus-cloud-orchestrator',
          full_name: 'mohandagar/nexus-cloud-orchestrator',
          description: 'Zero-downtime microservice deployer and automated container pipeline with WebSocket telemetry.',
          html_url: `https://github.com/${GITHUB_USERNAME}/nexus-cloud-orchestrator`,
          homepage: 'https://mohandagar.in/projects/nexus',
          stargazers_count: 142,
          forks_count: 28,
          language: 'TypeScript',
          topics: ['docker', 'kubernetes', 'orchestration', 'microservices'],
          updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          pinned: true,
        },
        {
          id: 103,
          name: 'hyper-cache-engine',
          full_name: 'mohandagar/hyper-cache-engine',
          description: 'Ultra-low latency in-memory key-value store implementing Redis wire protocol.',
          html_url: `https://github.com/${GITHUB_USERNAME}/hyper-cache-engine`,
          homepage: 'https://mohandagar.in/projects/hypercache',
          stargazers_count: 98,
          forks_count: 19,
          language: 'TypeScript',
          topics: ['cache', 'redis-protocol', 'performance', 'systems'],
          updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
          pinned: true,
        },
        {
          id: 104,
          name: 'flux-graphql-gateway',
          full_name: 'mohandagar/flux-graphql-gateway',
          description: 'High-speed schema stitching and unified API router for distributed microservices.',
          html_url: `https://github.com/${GITHUB_USERNAME}/flux-graphql-gateway`,
          homepage: 'https://mohandagar.in/projects/flux',
          stargazers_count: 87,
          forks_count: 15,
          language: 'JavaScript',
          topics: ['graphql', 'gateway', 'apollo', 'api'],
          updated_at: new Date(Date.now() - 86400000 * 12).toISOString(),
          pinned: false,
        },
        {
          id: 105,
          name: 'devlens-cli',
          full_name: 'mohandagar/devlens-cli',
          description: 'Intelligent terminal tool for inspecting git repos, bundle diffs, and package sizes.',
          html_url: `https://github.com/${GITHUB_USERNAME}/devlens-cli`,
          homepage: null,
          stargazers_count: 112,
          forks_count: 22,
          language: 'Node.js',
          topics: ['cli', 'developer-tools', 'git', 'terminal'],
          updated_at: new Date(Date.now() - 86400000 * 18).toISOString(),
          pinned: false,
        },
        {
          id: 106,
          name: 'ai-prompt-studio',
          full_name: 'mohandagar/ai-prompt-studio',
          description: 'Visual prompt chaining canvas and interactive LLM workflow testing playground.',
          html_url: `https://github.com/${GITHUB_USERNAME}/ai-prompt-studio`,
          homepage: null,
          stargazers_count: 76,
          forks_count: 11,
          language: 'TypeScript',
          topics: ['ai', 'prompt-engineering', 'react', 'canvas'],
          updated_at: new Date(Date.now() - 86400000 * 25).toISOString(),
          pinned: false,
        }
      ],
      isLive: false,
    };
  }
}
