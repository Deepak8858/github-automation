import { NextRequest, NextResponse } from 'next/server';
import { reviewPRDiff } from '../../../lib/gemini';
import { fetchPRDiff } from '../../../lib/github';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Test connection mode
        if (body.testConnection) {
            const { geminiApiKey } = body;
            if (!geminiApiKey) {
                return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 400 });
            }
            try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: 'Say "connected" in one word.',
                });
                return NextResponse.json({ status: 'connected', response: response.text });
            } catch {
                return NextResponse.json({ error: 'Invalid Gemini API key' }, { status: 401 });
            }
        }

        const { githubToken, geminiApiKey, owner, repo, pullNumber, prTitle, prDescription } = body;

        if (!githubToken || !geminiApiKey || !owner || !repo || !pullNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the PR diff from GitHub
        const diff = await fetchPRDiff(githubToken, owner, repo, pullNumber);

        // Send to Gemini for review
        const review = await reviewPRDiff(geminiApiKey, diff, prTitle, prDescription);

        return NextResponse.json(review);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Review failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
