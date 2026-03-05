import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey, diff, model } = body;

        if (!apiKey || !diff || !provider) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const prompt = `Generate a conventional commit message for this diff. Respond in JSON format with keys: type (feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert), scope (optional), subject (max 72 chars), body (optional longer description), breaking (boolean), fullMessage (the complete formatted commit message).

Diff:
\`\`\`
${diff.substring(0, 10000)}
\`\`\`

Return ONLY valid JSON, no markdown formatting.`;

        let result;

        if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const response = await ai.models.generateContent({
                model: model || 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text || '{}';
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            result = JSON.parse(cleaned);
        } else {
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey });

            const response = await openai.chat.completions.create({
                model: model || 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            });

            const text = response.choices[0]?.message?.content || '{}';
            result = JSON.parse(text);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Commit message generation failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
