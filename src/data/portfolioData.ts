import { FeaturedProject, SkillItem, ExperienceItem, SocialLink, DnsConfigRecord } from '../types';

export const PERSONAL_INFO = {
  name: 'Mohan Dagar',
  title: 'Full Stack Engineer & Cloud Systems Builder',
  domain: 'mohandagar.in',
  cnameUrl: 'https://mohandagar.in',
  githubUsername: 'mohandagar',
  githubProfileUrl: 'https://github.com/mohandagar',
  email: 'jatdgr@gmail.com',
  location: 'New Delhi / Remote, India',
  tagline: 'Architecting scalable web applications, distributed systems, and developer tooling with modern JavaScript/TypeScript & Cloud infrastructure.',
  bio: `Hi, I'm Mohan Dagar! I build high-performance web applications, robust backend architectures, and open-source developer tools. Passionate about clean code, developer experience, scalable cloud workflows, and intuitive user interfaces.`,
  availability: 'Available for high-impact roles, consulting & open-source collaborations',
  yearsOfExperience: '5+ Years',
  stats: [
    { label: 'GitHub Repos', value: '45+' },
    { label: 'Total Contributions', value: '1,200+' },
    { label: 'Code Uptime / Reliability', value: '99.9%' },
    { label: 'Custom Domain', value: 'mohandagar.in' }
  ]
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'GitHub',
    url: 'https://github.com/mohandagar',
    icon: 'Github',
    label: 'github.com/mohandagar',
    handle: '@mohandagar'
  },
  {
    name: 'Email',
    url: 'mailto:jatdgr@gmail.com',
    icon: 'Mail',
    label: 'jatdgr@gmail.com',
    handle: 'jatdgr@gmail.com'
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/in/mohandagar',
    icon: 'Linkedin',
    label: 'linkedin.com/in/mohandagar',
    handle: 'mohandagar'
  },
  {
    name: 'Twitter / X',
    url: 'https://x.com/mohandagar',
    icon: 'Twitter',
    label: 'x.com/mohandagar',
    handle: '@mohandagar'
  },
  {
    name: 'Website / CNAME',
    url: 'https://mohandagar.in',
    icon: 'Globe',
    label: 'mohandagar.in',
    handle: 'mohandagar.in'
  }
];

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'multi-checkpoint-runner-stopwatch',
    title: 'Multi-Checkpoint Runner Stopwatch & Timing Engine',
    tagline: 'Distributed authoritative race timing across unlimited checkpoint phones',
    description: 'A professional real-time timing system allowing one runner to be timed across unlimited checkpoints using multiple synchronized devices. Features authoritative cloud timer, instant QR/Join codes, live pacing calculations, missed-checkpoint recovery, interactive Recharts graphs, and high-resolution PNG/JPEG exports.',
    category: 'Full-Stack',
    tags: ['React 19', 'TypeScript', 'Firebase Firestore', 'Recharts', 'html-to-image', 'Tailwind CSS'],
    repoUrl: 'https://github.com/mohandagar/multi-checkpoint-runner-stopwatch',
    demoUrl: 'https://mohandagar.in/?app=race',
    stars: 189,
    forks: 36,
    featured: true,
    features: [
      'Authoritative synchronized race start timestamp across all devices',
      'Instant join via unique 6-character Join Codes and QR scanning cards',
      'Automatic missed checkpoint recovery without data fabrication',
      'High-res PNG & JPEG official activity export with Recharts pace charts'
    ],
    metrics: [
      { label: 'Checkpoints', value: 'Unlimited' },
      { label: 'Sync Accuracy', value: '< 5ms' }
    ]
  },
  {
    id: 'nexus-cloud-orchestrator',
    title: 'Nexus Cloud Orchestrator',
    tagline: 'Zero-downtime microservice deployer and automated container pipeline',
    description: 'A high-throughput deployment pipeline tool with automated health verification, rollbacks, and WebSocket cluster metrics dashboard.',
    category: 'DevOps & Tools',
    tags: ['TypeScript', 'Node.js', 'Docker', 'Kubernetes', 'WebSockets', 'Tailwind'],
    repoUrl: 'https://github.com/mohandagar/nexus-cloud-orchestrator',
    demoUrl: 'https://mohandagar.in/projects/nexus',
    stars: 142,
    forks: 28,
    featured: true,
    features: [
      'Multi-region cluster synchronization with instant failover',
      'Real-time CPU and memory telemetry visualization via Canvas',
      'Automated SSL & CNAME certificate management'
    ],
    metrics: [
      { label: 'Deploy Latency', value: '< 800ms' },
      { label: 'Uptime', value: '99.98%' }
    ]
  },
  {
    id: 'hyper-cache-engine',
    title: 'HyperCache In-Memory Engine',
    tagline: 'Ultra-low latency distributed key-value store with raft consensus',
    description: 'High performance caching layer built with TypeScript and Node native bindings, offering sub-millisecond read/writes and snapshot persistence.',
    category: 'Full-Stack',
    tags: ['TypeScript', 'Node.js', 'Redis Protocol', 'Systems', 'Vite'],
    repoUrl: 'https://github.com/mohandagar/hyper-cache-engine',
    demoUrl: 'https://mohandagar.in/projects/hypercache',
    stars: 98,
    forks: 19,
    featured: true,
    features: [
      'Compatible with standard Redis RESP commands',
      'LRU and LFU eviction algorithms with custom TTL jitter',
      'Interactive visual memory allocation explorer'
    ],
    metrics: [
      { label: 'Throughput', value: '45k req/s' },
      { label: 'P99 Latency', value: '0.42ms' }
    ]
  },
  {
    id: 'mohandagar-portfolio',
    title: 'mohandagar.in Official Web Platform',
    tagline: 'The official personal website & live GitHub showcase for mohandagar.in',
    description: 'Production-ready personal site crafted with React 19, Tailwind CSS v4, Motion, dynamic GitHub API integration, and automated GitHub Pages CNAME deployment.',
    category: 'Full-Stack',
    tags: ['React 19', 'TypeScript', 'Tailwind CSS', 'GitHub Actions', 'CNAME DNS'],
    repoUrl: 'https://github.com/mohandagar/mohandagar',
    demoUrl: 'https://mohandagar.in',
    stars: 64,
    forks: 14,
    featured: true,
    features: [
      'Automated CNAME record generation for mohandagar.in',
      'Interactive CLI developer terminal with bash commands',
      'Live fallback sync with GitHub REST API'
    ],
    metrics: [
      { label: 'Lighthouse Score', value: '100/100' },
      { label: 'Build Time', value: '< 2.5s' }
    ]
  },
  {
    id: 'flux-graph-ql-gateway',
    title: 'Flux Federated GraphQL Gateway',
    tagline: 'High-speed schema stitching and unified API router for microservices',
    description: 'A composable gateway service unifying multiple REST and GraphQL backends into a single type-safe schema with query batching and rate limiting.',
    category: 'Full-Stack',
    tags: ['GraphQL', 'Node.js', 'TypeScript', 'PostgreSQL', 'Apollo'],
    repoUrl: 'https://github.com/mohandagar/flux-graphql-gateway',
    demoUrl: 'https://mohandagar.in/projects/flux',
    stars: 87,
    forks: 15,
    featured: false,
    features: [
      'Automatic N+1 query deduplication with DataLoader',
      'Role-based JWT authentication and field-level permissions',
      'Integrated playground with interactive query builder'
    ]
  },
  {
    id: 'dev-lens-cli',
    title: 'DevLens Terminal CLI',
    tagline: 'Intelligent terminal tool for inspecting git repos, diffs, and bundle sizes',
    description: 'Lightweight command-line interface to analyze repository health, find oversized dependencies, and audit security vulnerabilities.',
    category: 'DevOps & Tools',
    tags: ['Node.js', 'CLI', 'Git API', 'npm', 'ESM'],
    repoUrl: 'https://github.com/mohandagar/devlens-cli',
    stars: 112,
    forks: 22,
    featured: false,
    features: [
      'Interactive blessed UI in terminal',
      'Zero external runtime dependencies',
      'Exportable markdown audit reports'
    ]
  },
  {
    id: 'ai-prompt-studio',
    title: 'AI Workflow Studio',
    tagline: 'Visual prompt chaining canvas and testing playground',
    description: 'Interactive canvas for constructing modular AI generation pipelines with branch evaluation, cost estimation, and model comparison.',
    category: 'AI & ML',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Gemini API', 'Canvas'],
    repoUrl: 'https://github.com/mohandagar/ai-prompt-studio',
    stars: 76,
    forks: 11,
    featured: false,
    features: [
      'Drag-and-drop node graph canvas',
      'Token consumption analytics and token budget alerts',
      'Exportable SDK client code in TypeScript and Python'
    ]
  }
];

export const SKILL_ITEMS: SkillItem[] = [
  // Frontend
  { name: 'TypeScript', level: 95, category: 'Languages', icon: 'Code2', yearsOfExp: '5 yrs', featured: true },
  { name: 'React & Next.js', level: 92, category: 'Frontend', icon: 'Atom', yearsOfExp: '5 yrs', featured: true },
  { name: 'Tailwind CSS', level: 96, category: 'Frontend', icon: 'Palette', yearsOfExp: '4 yrs', featured: true },
  { name: 'JavaScript (ES6+)', level: 96, category: 'Languages', icon: 'FileCode', yearsOfExp: '6 yrs', featured: true },
  { name: 'HTML5 / CSS3', level: 95, category: 'Frontend', icon: 'Layout', yearsOfExp: '6 yrs' },
  { name: 'State Management (Zustand/Redux)', level: 90, category: 'Frontend', icon: 'Layers', yearsOfExp: '4 yrs' },

  // Backend
  { name: 'Node.js & Express', level: 92, category: 'Backend', icon: 'Server', yearsOfExp: '5 yrs', featured: true },
  { name: 'REST & GraphQL APIs', level: 90, category: 'Backend', icon: 'Network', yearsOfExp: '4 yrs', featured: true },
  { name: 'Python', level: 85, category: 'Languages', icon: 'Terminal', yearsOfExp: '3 yrs', featured: true },
  { name: 'Go (Golang)', level: 78, category: 'Languages', icon: 'Cpu', yearsOfExp: '2 yrs' },
  { name: 'WebSockets & Realtime', level: 88, category: 'Backend', icon: 'Zap', yearsOfExp: '3 yrs' },

  // DevOps & Cloud
  { name: 'Docker & Containers', level: 88, category: 'DevOps & Cloud', icon: 'Box', yearsOfExp: '4 yrs', featured: true },
  { name: 'GitHub Actions & CI/CD', level: 92, category: 'DevOps & Cloud', icon: 'GitBranch', yearsOfExp: '4 yrs', featured: true },
  { name: 'Linux / Bash Scripting', level: 86, category: 'DevOps & Cloud', icon: 'TerminalSquare', yearsOfExp: '5 yrs' },
  { name: 'DNS & CNAME / Custom Domains', level: 94, category: 'DevOps & Cloud', icon: 'Globe2', yearsOfExp: '5 yrs', featured: true },
  { name: 'Cloud Deployments (GCP / AWS / Vercel)', level: 86, category: 'DevOps & Cloud', icon: 'Cloud', yearsOfExp: '4 yrs' },

  // Databases & Tools
  { name: 'PostgreSQL & SQL', level: 88, category: 'Databases & Tools', icon: 'Database', yearsOfExp: '4 yrs', featured: true },
  { name: 'MongoDB', level: 85, category: 'Databases & Tools', icon: 'HardDrive', yearsOfExp: '4 yrs' },
  { name: 'Redis', level: 84, category: 'Databases & Tools', icon: 'Flame', yearsOfExp: '3 yrs' },
  { name: 'Git & Version Control', level: 96, category: 'Databases & Tools', icon: 'GitCommit', yearsOfExp: '6 yrs', featured: true },
  { name: 'Vite & Modern Tooling', level: 94, category: 'Databases & Tools', icon: 'Wrench', yearsOfExp: '4 yrs' }
];

export const EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    id: 'lead-dev',
    role: 'Senior Full Stack Engineer',
    organization: 'Tech Innovations & Cloud Labs',
    location: 'Remote',
    period: '2022 — Present',
    type: 'Full-time',
    description: 'Leading architecture of scalable microservices, high-traffic consumer web applications, and developer productivity pipelines.',
    achievements: [
      'Architected cloud service infrastructure supporting over 250,000 monthly active users with 99.95% uptime.',
      'Spearheaded transition to TypeScript & Next.js/React, improving page load speeds by 42%.',
      'Automated multi-environment CI/CD workflows and deployment gates with GitHub Actions.'
    ],
    techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'GCP']
  },
  {
    id: 'oss-builder',
    role: 'Open Source Creator & Maintainer',
    organization: 'GitHub (@mohandagar)',
    location: 'Global',
    period: '2020 — Present',
    type: 'Open Source',
    description: 'Authoring developer utilities, starter kits, and cloud automation tools for the open-source engineering community.',
    achievements: [
      'Published and maintained multiple repositories on GitHub with community adoption.',
      'Configured custom domain infrastructure (mohandagar.in) with automated GitHub Pages workflows.',
      'Contributed bug fixes and performance improvements to leading open-source repositories.'
    ],
    techStack: ['GitHub API', 'Node.js', 'TypeScript', 'Tailwind CSS', 'Vite', 'Bash']
  },
  {
    id: 'swe-fullstack',
    role: 'Software Engineer',
    organization: 'Digital Products Studio',
    location: 'New Delhi, India',
    period: '2019 — 2022',
    type: 'Full-time',
    description: 'Engineered responsive frontends, RESTful microservices, and database models for enterprise clients.',
    achievements: [
      'Built 15+ bespoke client web apps and portals from initial wireframes to production release.',
      'Integrated payment gateways, authentication layers, and real-time notification engines.',
      'Conducted peer code reviews and mentored junior frontend engineers in modern React patterns.'
    ],
    techStack: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'AWS']
  }
];

export const DNS_CONFIG_RECORDS: DnsConfigRecord[] = [
  {
    type: 'A',
    host: '@',
    value: '185.199.108.153',
    ttl: 'Auto / 3600',
    purpose: 'Apex domain mapping to GitHub Pages server 1'
  },
  {
    type: 'A',
    host: '@',
    value: '185.199.109.153',
    ttl: 'Auto / 3600',
    purpose: 'Apex domain mapping to GitHub Pages server 2'
  },
  {
    type: 'A',
    host: '@',
    value: '185.199.110.153',
    ttl: 'Auto / 3600',
    purpose: 'Apex domain mapping to GitHub Pages server 3'
  },
  {
    type: 'A',
    host: '@',
    value: '185.199.111.153',
    ttl: 'Auto / 3600',
    purpose: 'Apex domain mapping to GitHub Pages server 4'
  },
  {
    type: 'CNAME',
    host: 'www',
    value: 'mohandagar.github.io',
    ttl: 'Auto / 3600',
    purpose: 'Subdomain www alias redirecting to GitHub Pages profile'
  }
];
