import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey, messages, model } = body;

        if (!apiKey || !messages || !provider) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let responseText = '';

        if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });
            const lastMessage = messages[messages.length - 1];

            const systemContext = `You are GitAgent, an AI assistant specializing in GitHub automation, code review, and software engineering. You help users with repositories, code review, debugging, documentation, and best practices. Be concise, technical, and helpful. Format responses with markdown when appropriate.`;

            const response = await ai.models.generateContent({
                model: model || 'gemini-2.5-flash',
                contents: `${systemContext}\n\nUser: ${lastMessage.content}`,
            });

            responseText = response.text || 'No response generated.';
        } else {
            // OpenAI or Copilot
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey });

            const systemMessage = {
                role: 'system' as const,
                content: `You are GitAgent, an AI assistant specializing in GitHub automation, code review, and software engineering. You help users with repositories, code review, debugging, documentation, and best practices. Be concise, technical, and helpful. Format responses with markdown when appropriate.`
            };

            const response = await openai.chat.completions.create({
                model: model || 'gpt-4o',
                messages: [systemMessage, ...messages],
                temperature: 0.7,
                max_tokens: 2000,
            });

            responseText = response.choices[0]?.message?.content || 'No response generated.';
        }

        return NextResponse.json({ response: responseText });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Chat failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
