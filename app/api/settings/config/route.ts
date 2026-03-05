import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasGithubToken: !!process.env.GITHUB_TOKEN,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasOpenAiKey: !!process.env.OPENAI_API_KEY,
        hasCopilotKey: !!process.env.COPILOT_API_KEY,
    });
}
