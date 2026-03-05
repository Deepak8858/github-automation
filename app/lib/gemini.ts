import { GoogleGenAI } from '@google/genai';

export function createGeminiClient(apiKey: string) {
    return new GoogleGenAI({ apiKey });
}

export async function reviewPRDiff(apiKey: string, diff: string, prTitle: string, prDescription: string) {
    const ai = createGeminiClient(apiKey);

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

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

export async function scanCodeForIssues(apiKey: string, files: { path: string; content: string }[], repoName: string) {
    const ai = createGeminiClient(apiKey);

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

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

export async function suggestContributions(apiKey: string, repoInfo: { name: string; description: string; language: string; topics?: string[] }) {
    const ai = createGeminiClient(apiKey);

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

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-pro',
        contents: prompt,
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}
