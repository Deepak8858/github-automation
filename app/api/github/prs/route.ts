import { NextRequest, NextResponse } from 'next/server';
import { fetchPullRequests, fetchPRDiff } from '../../../lib/github';

export async function GET(request: NextRequest) {
    const token = request.headers.get('x-github-token');
    if (!token) {
        return NextResponse.json({ error: 'Missing GitHub token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
        return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    try {
        const prs = await fetchPullRequests(token, owner, repo);
        return NextResponse.json(prs);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch PRs';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
