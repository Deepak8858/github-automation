import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { provider, apiKey, message, badgeData } = body;

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    const systemPrompt = `You are the GitHub Badges AI Agent — a friendly, knowledgeable assistant that helps developers earn more GitHub achievements and badges.

You have access to the user's current badge/achievement data. Use it to give personalized, actionable advice.

Current user stats:
- Public Repos: ${badgeData?.stats?.publicRepos ?? 'unknown'}
- Total Stars: ${badgeData?.stats?.totalStars ?? 'unknown'}
- Followers: ${badgeData?.stats?.followers ?? 'unknown'}
- Pull Requests: ${badgeData?.stats?.prCount ?? 'unknown'}
- Issues Created: ${badgeData?.stats?.issueCount ?? 'unknown'}
- Public Gists: ${badgeData?.stats?.publicGists ?? 'unknown'}
- Total Forks: ${badgeData?.stats?.totalForks ?? 'unknown'}

Earned badges: ${badgeData?.badges?.filter((b: any) => b.earned).map((b: any) => b.name).join(', ') || 'None yet'}
Unearned badges: ${badgeData?.badges?.filter((b: any) => !b.earned).map((b: any) => `${b.name} (${b.current}/${b.target})`).join(', ') || 'All earned!'}

Guidelines:
- Be encouraging and motivating
- Give specific, actionable steps (e.g. "Create 3 more repos to earn Repository Collector")
- Suggest strategies: contributing to open source, creating useful tools, writing gists, engaging with the community
- Keep responses concise but helpful (2-4 paragraphs max)
- Use emoji to make it fun
- If the user asks about a specific badge, focus on that badge's requirements and progress`;

    try {
        if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + '\n\nUser question: ' + message }] },
                ],
            });
            return NextResponse.json({ reply: response.text || 'No response generated.' });
        }

        if (provider === 'openai' || provider === 'copilot') {
            const baseURL = provider === 'copilot' ? 'https://api.githubcopilot.com' : 'https://api.openai.com/v1';
            const model = provider === 'copilot' ? 'gpt-4o' : 'gpt-4o-mini';

            const res = await fetch(`${baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message },
                    ],
                    max_tokens: 1000,
                }),
            });
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'No response generated.';
            return NextResponse.json({ reply });
        }

        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'AI generation failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
