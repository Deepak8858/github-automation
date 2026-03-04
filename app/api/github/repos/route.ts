import { NextRequest, NextResponse } from 'next/server';
import { fetchUserRepos, fetchRepoDetails, searchTrendingRepos } from '../../../lib/github';

export async function GET(request: NextRequest) {
    const token = request.headers.get('x-github-token');
    if (!token) {
        return NextResponse.json({ error: 'Missing GitHub token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const trending = searchParams.get('trending');
    const language = searchParams.get('language');

    try {
        if (trending === 'true') {
            const repos = await searchTrendingRepos(token, language || undefined);
            return NextResponse.json(repos);
        }

        if (owner && repo) {
            const data = await fetchRepoDetails(token, owner, repo);
            return NextResponse.json(data);
        }

        const repos = await fetchUserRepos(token);
        return NextResponse.json(repos);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch repos';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
