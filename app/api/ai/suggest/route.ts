import { NextRequest, NextResponse } from 'next/server';
import { suggestContributions } from '../../../lib/gemini';
import { suggestContributionsOpenAI } from '../../../lib/openai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { geminiApiKey, openaiApiKey, provider, repoInfo } = body;

        const effectiveProvider = provider || (openaiApiKey ? 'openai' : 'gemini');
        const effectiveKey = effectiveProvider === 'gemini' ? (geminiApiKey || '') : (openaiApiKey || '');

        if (!effectiveKey || !repoInfo) {
            return NextResponse.json({ error: 'Missing required fields (AI API key + repo info)' }, { status: 400 });
        }

        let result;
        if (effectiveProvider === 'gemini') {
            result = await suggestContributions(effectiveKey, repoInfo);
        } else {
            result = await suggestContributionsOpenAI(effectiveKey, repoInfo);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Suggestion failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
