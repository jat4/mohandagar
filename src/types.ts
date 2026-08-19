export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  default_branch?: string;
  pinned?: boolean;
}

export interface FeaturedProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  longDescription?: string;
  category: 'Full-Stack' | 'AI & ML' | 'DevOps & Tools' | 'Open Source' | 'Mobile';
  tags: string[];
  repoUrl: string;
  demoUrl?: string;
  stars?: number;
  forks?: number;
  features: string[];
  architecture?: string[];
  featured: boolean;
  metrics?: { label: string; value: string }[];
}

export interface SkillItem {
  name: string;
  level: number; // 1-100
  category: 'Frontend' | 'Backend' | 'DevOps & Cloud' | 'Languages' | 'Databases & Tools';
  icon: string;
  yearsOfExp: string;
  featured?: boolean;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  period: string;
  type: 'Full-time' | 'Contract' | 'Open Source' | 'Education';
  description: string;
  achievements: string[];
  techStack: string[];
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  label: string;
  handle?: string;
}

export interface DnsConfigRecord {
  type: 'A' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: string;
  purpose: string;
}
