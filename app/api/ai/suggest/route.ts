import { NextRequest, NextResponse } from 'next/server';
import { suggestContributions } from '../../../lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { geminiApiKey, repoInfo } = body;

        if (!geminiApiKey || !repoInfo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await suggestContributions(geminiApiKey, repoInfo);

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Suggestion failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
