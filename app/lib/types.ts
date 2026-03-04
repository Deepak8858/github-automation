export interface RepoInfo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  default_branch: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
  diff_url: string;
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  labels: Array<{
    name: string;
    color: string;
  }>;
  user: {
    login: string;
    avatar_url: string;
  };
}

export interface AIReviewComment {
  file: string;
  line: number;
  severity: 'critical' | 'warning' | 'suggestion' | 'praise';
  comment: string;
  suggestedFix?: string;
}

export interface AIReviewResult {
  summary: string;
  overallRating: number;
  comments: AIReviewComment[];
  autoFixAvailable: boolean;
}

export interface ScannedIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  lineStart: number;
  lineEnd: number;
  category: string;
  suggestedFix: string;
}

export interface ScanResult {
  repoName: string;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: ScannedIssue[];
}

export interface ContributionSuggestion {
  id: string;
  repo: RepoInfo;
  type: 'bug-fix' | 'feature' | 'documentation' | 'refactor' | 'test';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  files: string[];
}

export interface ActivityItem {
  id: string;
  type: 'pr-review' | 'issue-created' | 'fix-applied' | 'contribution' | 'repo-connected';
  title: string;
  description: string;
  timestamp: string;
  repo?: string;
  status: 'success' | 'pending' | 'failed';
  url?: string;
}

export interface AppSettings {
  githubToken: string;
  geminiApiKey: string;
  autoReview: boolean;
  autoFix: boolean;
  scanSchedule: 'manual' | 'daily' | 'weekly';
}

export interface DashboardStats {
  reposConnected: number;
  prsReviewed: number;
  issuesFixed: number;
  contributions: number;
}
