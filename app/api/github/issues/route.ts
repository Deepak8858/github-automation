import { NextRequest, NextResponse } from 'next/server';
import { fetchIssues, createIssue } from '../../../lib/github';

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
        const issues = await fetchIssues(token, owner, repo);
        return NextResponse.json(issues);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch issues';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const token = request.headers.get('x-github-token');
    if (!token) {
        return NextResponse.json({ error: 'Missing GitHub token' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { owner, repo, title, body: issueBody, labels } = body;

        if (!owner || !repo || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const issue = await createIssue(token, owner, repo, title, issueBody || '', labels || []);
        return NextResponse.json(issue);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create issue';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
