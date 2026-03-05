import { NextRequest, NextResponse } from 'next/server';
import { reviewPRDiff } from '../../../lib/gemini';
import { reviewPRDiffOpenAI } from '../../../lib/openai';
import { fetchPRDiff } from '../../../lib/github';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Test connection mode
        if (body.testConnection) {
            const { provider, apiKey, geminiApiKey } = body;
            const effectiveProvider = provider || 'gemini';
            const effectiveKey = apiKey || geminiApiKey;

            if (!effectiveKey) {
                return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
            }

            try {
                if (effectiveProvider === 'gemini') {
                    const { GoogleGenAI } = await import('@google/genai');
                    const ai = new GoogleGenAI({ apiKey: effectiveKey });
                    const response = await ai.models.generateContent({
                        model: 'gemini-1.5-flash',
                        contents: 'Say "connected" in one word.',
                    });
                    return NextResponse.json({ status: 'connected', response: response.text });
                } else {
                    // OpenAI or Copilot
                    const OpenAI = (await import('openai')).default;
                    const openai = new OpenAI({ apiKey: effectiveKey });
                    const response = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
                        max_tokens: 10,
                    });
                    return NextResponse.json({ status: 'connected', response: response.choices[0]?.message?.content });
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Invalid API key';
                return NextResponse.json({ error: msg }, { status: 401 });
            }
        }

        // Full review mode
        const { githubToken, geminiApiKey, openaiApiKey, provider, apiKey, owner, repo, pullNumber, prTitle, prDescription } = body;

        const effectiveProvider = provider || (openaiApiKey ? 'openai' : 'gemini');
        let effectiveKey = effectiveProvider === 'gemini' ? (geminiApiKey || apiKey || process.env.GEMINI_API_KEY || '') : (openaiApiKey || apiKey || process.env.OPENAI_API_KEY || '');
        if (effectiveProvider === 'copilot' && !effectiveKey) {
            effectiveKey = process.env.COPILOT_API_KEY || '';
        }

        const effectiveGithubToken = githubToken || process.env.GITHUB_TOKEN;

        if (!effectiveGithubToken || !effectiveKey || !owner || !repo || !pullNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the PR diff from GitHub
        const diff = await fetchPRDiff(effectiveGithubToken, owner, repo, pullNumber);

        // Send to AI for review
        let review;
        if (effectiveProvider === 'gemini') {
            review = await reviewPRDiff(effectiveKey, diff, prTitle, prDescription);
        } else {
            review = await reviewPRDiffOpenAI(effectiveKey, diff, prTitle, prDescription);
        }

        return NextResponse.json(review);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Review failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
