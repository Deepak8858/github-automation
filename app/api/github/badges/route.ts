import { NextRequest, NextResponse } from 'next/server';
import { fetchUserBadgeStats } from '../../../lib/github';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    earned: boolean;
    progress: number;
    current: number;
    target: number;
    category: string;
}

function computeBadges(stats: any): Badge[] {
    const badges: Badge[] = [
        // Repository badges
        {
            id: 'first-repo', name: 'First Repository', description: 'Create your first public repository',
            icon: '📦', tier: 'bronze', earned: stats.publicRepos >= 1,
            progress: Math.min(100, (stats.publicRepos / 1) * 100), current: stats.publicRepos, target: 1, category: 'Repositories',
        },
        {
            id: 'repo-collector', name: 'Repository Collector', description: 'Have 10 public repositories',
            icon: '🗂️', tier: 'silver', earned: stats.publicRepos >= 10,
            progress: Math.min(100, (stats.publicRepos / 10) * 100), current: stats.publicRepos, target: 10, category: 'Repositories',
        },
        {
            id: 'repo-master', name: 'Repository Master', description: 'Have 50 public repositories',
            icon: '🏗️', tier: 'gold', earned: stats.publicRepos >= 50,
            progress: Math.min(100, (stats.publicRepos / 50) * 100), current: stats.publicRepos, target: 50, category: 'Repositories',
        },
        // Star badges
        {
            id: 'first-star', name: 'First Star', description: 'Earn your first star on any repository',
            icon: '⭐', tier: 'bronze', earned: stats.totalStars >= 1,
            progress: Math.min(100, (stats.totalStars / 1) * 100), current: stats.totalStars, target: 1, category: 'Stars',
        },
        {
            id: 'rising-star', name: 'Rising Star', description: 'Earn 50 total stars across all repositories',
            icon: '🌟', tier: 'silver', earned: stats.totalStars >= 50,
            progress: Math.min(100, (stats.totalStars / 50) * 100), current: stats.totalStars, target: 50, category: 'Stars',
        },
        {
            id: 'galaxy-brain', name: 'Galaxy Brain', description: 'Earn 500 total stars',
            icon: '🧠', tier: 'gold', earned: stats.totalStars >= 500,
            progress: Math.min(100, (stats.totalStars / 500) * 100), current: stats.totalStars, target: 500, category: 'Stars',
        },
        {
            id: 'supernova', name: 'Supernova', description: 'Earn 5000 total stars',
            icon: '💫', tier: 'platinum', earned: stats.totalStars >= 5000,
            progress: Math.min(100, (stats.totalStars / 5000) * 100), current: stats.totalStars, target: 5000, category: 'Stars',
        },
        // PR badges
        {
            id: 'first-pr', name: 'Pull Shark', description: 'Open your first pull request',
            icon: '🦈', tier: 'bronze', earned: stats.prCount >= 1,
            progress: Math.min(100, (stats.prCount / 1) * 100), current: stats.prCount, target: 1, category: 'Pull Requests',
        },
        {
            id: 'pr-machine', name: 'PR Machine', description: 'Open 50 pull requests',
            icon: '🔧', tier: 'silver', earned: stats.prCount >= 50,
            progress: Math.min(100, (stats.prCount / 50) * 100), current: stats.prCount, target: 50, category: 'Pull Requests',
        },
        {
            id: 'pr-legend', name: 'PR Legend', description: 'Open 500 pull requests',
            icon: '🏆', tier: 'gold', earned: stats.prCount >= 500,
            progress: Math.min(100, (stats.prCount / 500) * 100), current: stats.prCount, target: 500, category: 'Pull Requests',
        },
        // Issue badges
        {
            id: 'bug-reporter', name: 'Bug Reporter', description: 'Open your first issue',
            icon: '🐛', tier: 'bronze', earned: stats.issueCount >= 1,
            progress: Math.min(100, (stats.issueCount / 1) * 100), current: stats.issueCount, target: 1, category: 'Issues',
        },
        {
            id: 'issue-hunter', name: 'Issue Hunter', description: 'Open 25 issues',
            icon: '🔍', tier: 'silver', earned: stats.issueCount >= 25,
            progress: Math.min(100, (stats.issueCount / 25) * 100), current: stats.issueCount, target: 25, category: 'Issues',
        },
        // Follower badges
        {
            id: 'social', name: 'Social Butterfly', description: 'Get 10 followers',
            icon: '🦋', tier: 'bronze', earned: stats.followers >= 10,
            progress: Math.min(100, (stats.followers / 10) * 100), current: stats.followers, target: 10, category: 'Community',
        },
        {
            id: 'influencer', name: 'Influencer', description: 'Get 100 followers',
            icon: '📢', tier: 'silver', earned: stats.followers >= 100,
            progress: Math.min(100, (stats.followers / 100) * 100), current: stats.followers, target: 100, category: 'Community',
        },
        {
            id: 'thought-leader', name: 'Thought Leader', description: 'Get 1000 followers',
            icon: '🎯', tier: 'gold', earned: stats.followers >= 1000,
            progress: Math.min(100, (stats.followers / 1000) * 100), current: stats.followers, target: 1000, category: 'Community',
        },
        // Fork badges
        {
            id: 'forked', name: 'Forked!', description: 'Have repos forked 10 times total',
            icon: '🍴', tier: 'silver', earned: stats.totalForks >= 10,
            progress: Math.min(100, (stats.totalForks / 10) * 100), current: stats.totalForks, target: 10, category: 'Community',
        },
        // Gist badges
        {
            id: 'snippet-master', name: 'Snippet Master', description: 'Publish 5 public gists',
            icon: '📝', tier: 'bronze', earned: stats.publicGists >= 5,
            progress: Math.min(100, (stats.publicGists / 5) * 100), current: stats.publicGists, target: 5, category: 'Gists',
        },
        // Veteran badge
        {
            id: 'veteran', name: 'GitHub Veteran', description: 'Account older than 3 years',
            icon: '🏅', tier: 'silver',
            earned: (Date.now() - new Date(stats.createdAt).getTime()) > 3 * 365 * 24 * 60 * 60 * 1000,
            progress: Math.min(100, ((Date.now() - new Date(stats.createdAt).getTime()) / (3 * 365 * 24 * 60 * 60 * 1000)) * 100),
            current: Math.floor((Date.now() - new Date(stats.createdAt).getTime()) / (365 * 24 * 60 * 60 * 1000)),
            target: 3, category: 'Account',
        },
    ];
    return badges;
}

export async function GET(request: NextRequest) {
    const token = request.headers.get('x-github-token');
    if (!token) {
        return NextResponse.json({ error: 'Missing GitHub token' }, { status: 401 });
    }

    try {
        const stats = await fetchUserBadgeStats(token);
        const badges = computeBadges(stats);
        const earned = badges.filter(b => b.earned).length;
        return NextResponse.json({
            user: {
                login: stats.login,
                name: stats.name,
                avatarUrl: stats.avatarUrl,
                bio: stats.bio,
            },
            stats,
            badges,
            summary: { total: badges.length, earned, unearned: badges.length - earned },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch badges';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
