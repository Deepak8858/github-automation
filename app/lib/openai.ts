import OpenAI from 'openai';

export function createOpenAIClient(apiKey: string) {
    return new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
}

export async function reviewPRDiffOpenAI(apiKey: string, diff: string, prTitle: string, prDescription: string, model: string = 'gpt-4o') {
    const openai = createOpenAIClient(apiKey);

    const prompt = `You are an expert code reviewer. Analyze this pull request and provide a structured review.

**PR Title:** ${prTitle}
**PR Description:** ${prDescription || 'No description provided'}

**Diff:**
\`\`\`
${diff.substring(0, 15000)}
\`\`\`

Respond in this exact JSON format:
{
  "summary": "Brief overall summary of the changes",
  "overallRating": <number 1-10>,
  "comments": [
    {
      "file": "filename",
      "line": <line number>,
      "severity": "critical|warning|suggestion|praise",
      "comment": "Your review comment",
      "suggestedFix": "Optional code fix suggestion"
    }
  ],
  "autoFixAvailable": true/false
}

Focus on:
- Security vulnerabilities
- Performance issues
- Code quality and best practices
- Potential bugs
- Missing error handling
- Also praise good patterns

Return ONLY valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
}

export async function scanCodeForIssuesOpenAI(apiKey: string, files: { path: string; content: string }[], repoName: string, model: string = 'gpt-4o') {
    const openai = createOpenAIClient(apiKey);

    const fileContents = files
        .map(f => `--- ${f.path} ---\n${f.content.substring(0, 3000)}`)
        .join('\n\n');

    const prompt = `You are an expert code analyzer. Scan the following code files for bugs, security issues, performance problems, and improvements.

**Repository:** ${repoName}

**Files:**
${fileContents.substring(0, 20000)}

Respond in this exact JSON format:
{
  "totalIssues": <number>,
  "criticalCount": <number>,
  "highCount": <number>,
  "mediumCount": <number>,
  "lowCount": <number>,
  "issues": [
    {
      "id": "unique-id",
      "title": "Issue title",
      "description": "Detailed description",
      "severity": "critical|high|medium|low",
      "file": "affected filename",
      "lineStart": <number>,
      "lineEnd": <number>,
      "category": "security|performance|bug|code-quality|maintainability",
      "suggestedFix": "Code fix or recommendation"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
}

export async function suggestContributionsOpenAI(apiKey: string, repoInfo: { name: string; description: string; language: string; topics?: string[] }, model: string = 'gpt-4o') {
    const openai = createOpenAIClient(apiKey);

    const prompt = `You are an open-source contribution advisor. Based on this repository, suggest ways someone could contribute.

**Repository:** ${repoInfo.name}
**Description:** ${repoInfo.description || 'No description'}
**Language:** ${repoInfo.language || 'Unknown'}
**Topics:** ${repoInfo.topics?.join(', ') || 'None'}

Respond in this exact JSON format:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "bug-fix|feature|documentation|refactor|test",
      "title": "Contribution title",
      "description": "What to do and why it helps",
      "difficulty": "easy|medium|hard",
      "estimatedTime": "e.g. 1-2 hours",
      "files": ["likely files to modify"]
    }
  ]
}

Provide 3-5 practical, specific suggestions. Return ONLY valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
}

export async function generateCommitMessage(apiKey: string, diff: string, model: string = 'gpt-4o') {
    const openai = createOpenAIClient(apiKey);

    const prompt = `You are an expert developer. Generate a conventional commit message for this diff.

**Diff:**
\`\`\`
${diff.substring(0, 10000)}
\`\`\`

Respond in this exact JSON format:
{
  "type": "feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert",
  "scope": "optional scope",
  "subject": "short description (max 72 chars)",
  "body": "optional longer description",
  "breaking": false,
  "fullMessage": "the complete formatted commit message"
}

Return ONLY valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
}

export async function chatWithOpenAI(apiKey: string, messages: { role: 'user' | 'assistant' | 'system'; content: string }[], model: string = 'gpt-4o') {
    const openai = createOpenAIClient(apiKey);

    const systemMessage = {
        role: 'system' as const,
        content: `You are GitAgent, an AI assistant specializing in GitHub automation, code review, and software engineering. You help users with:
- Understanding and managing GitHub repositories
- Writing and reviewing code
- Debugging issues and suggesting fixes
- Generating documentation and commit messages
- Explaining complex code patterns
- Suggesting best practices and improvements

Be concise, technical, and helpful. Format responses with markdown when appropriate.`
    };

    const response = await openai.chat.completions.create({
        model,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || 'No response generated.';
}

export async function generateCode(apiKey: string, prompt: string, language: string, model: string = 'gpt-4o') {
    const openai = createOpenAIClient(apiKey);

    const systemPrompt = `You are an expert software engineer. Generate clean, production-ready code based on the user's request.

Respond in this exact JSON format:
{
  "code": "the generated code",
  "language": "${language}",
  "explanation": "brief explanation of the code",
  "dependencies": ["list of required packages/imports"],
  "filename": "suggested filename"
}

Return ONLY valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content || '{}';
    return JSON.parse(text);
}
