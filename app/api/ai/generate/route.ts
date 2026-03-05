import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey, prompt, language, model } = body;

        let effectiveKey = apiKey;
        if (!effectiveKey) {
            if (provider === 'gemini') effectiveKey = process.env.GEMINI_API_KEY;
            else if (provider === 'openai') effectiveKey = process.env.OPENAI_API_KEY;
            else if (provider === 'copilot') effectiveKey = process.env.COPILOT_API_KEY;
        }

        if (!effectiveKey || !prompt || !provider) {
            return NextResponse.json({ error: 'Missing required fields or API key' }, { status: 400 });
        }

        const systemPrompt = `You are an expert software engineer. Generate clean, production-ready ${language || 'code'} based on the user's request.

Respond in this exact JSON format:
{
  "code": "the generated code",
  "language": "${language || 'javascript'}",
  "explanation": "brief explanation of the code",
  "dependencies": ["list of required packages/imports"],
  "filename": "suggested filename"
}

Return ONLY valid JSON, no markdown formatting.`;

        let result;

        if (provider === 'gemini') {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: effectiveKey });

            const response = await ai.models.generateContent({
                model: model || 'gemini-1.5-flash',
                contents: `${systemPrompt}\n\nRequest: ${prompt}`,
            });

            const text = response.text || '{}';
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            result = JSON.parse(cleaned);
        } else {
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey: effectiveKey });

            const response = await openai.chat.completions.create({
                model: model || 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.4,
            });

            const text = response.choices[0]?.message?.content || '{}';
            result = JSON.parse(text);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Code generation failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
