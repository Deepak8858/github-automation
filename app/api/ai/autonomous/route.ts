import { NextRequest, NextResponse } from 'next/server';
import { createIssue, createBranch, commitFile, createPullRequest, fetchRepoContents, fetchFileContent } from '../../../lib/github';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, githubToken, provider, apiKey, owner, repo } = body;

        if (!githubToken || !owner || !repo) {
            return NextResponse.json({ error: 'Missing required repository or auth fields' }, { status: 400 });
        }

        const effectiveProvider = provider || 'openai'; // default to openai if not specified for agentic tasks
        let effectiveKey = apiKey;

        if (!effectiveKey) {
            if (effectiveProvider === 'gemini') effectiveKey = process.env.GEMINI_API_KEY;
            else if (effectiveProvider === 'openai') effectiveKey = process.env.OPENAI_API_KEY;
            else if (effectiveProvider === 'copilot') effectiveKey = process.env.COPILOT_API_KEY;
        }

        if (action === 'analyze') {
            if (!effectiveKey) return NextResponse.json({ error: 'Missing AI API key' }, { status: 400 });

            // 1. Fetch repo contents to find a file to analyze
            const contents = await fetchRepoContents(githubToken, owner, repo);
            if (!Array.isArray(contents)) {
                return NextResponse.json({ error: 'Could not list repo contents' }, { status: 500 });
            }

            const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];
            const targetFile = contents.find((item: any) =>
                item.type === 'file' && codeExtensions.some(ext => item.name.endsWith(ext))
            );

            if (!targetFile) {
                return NextResponse.json({ issueFound: false });
            }

            // 2. Fetch the content of the file
            const fileContent = await fetchFileContent(githubToken, owner, repo, targetFile.path);

            // 3. Ask AI to find an issue
            const prompt = `Analyze this file from ${owner}/${repo} named ${targetFile.path} and identify ONE specific, actionable issue (e.g., a bug, a security vulnerability, or a clear refactoring opportunity). 
Respond in this exact JSON format:
{
    "hasIssue": true,
    "title": "Short title describing the issue",
    "body": "Detailed description of the issue, why it's a problem, and how it should be fixed. Include markdown.",
    "targetFile": "${targetFile.path}"
}
If there are absolutely no issues, set "hasIssue" to false.

File content:
\`\`\`
${fileContent.substring(0, 8000)}
\`\`\``;

            let aiResult;

            if (effectiveProvider === 'gemini') {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: effectiveKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: prompt,
                });
                const text = response.text || '{}';
                const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                aiResult = JSON.parse(cleaned);
            } else {
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: effectiveKey });
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                });
                const text = response.choices[0]?.message?.content || '{}';
                aiResult = JSON.parse(text);
            }

            if (!aiResult.hasIssue) {
                return NextResponse.json({ issueFound: false });
            }

            return NextResponse.json({
                issueFound: true,
                issueTitle: `[Auto Agent] ${aiResult.title}`,
                issueBody: `This issue was automatically identified by the GitAgent Autonomous Agent.\n\n**File**: \`${aiResult.targetFile}\`\n\n### Description\n${aiResult.body}`,
                targetFile: aiResult.targetFile
            });
        }

        if (action === 'create_issue') {
            const { title, body: issueBody } = body;
            const issueData = await createIssue(githubToken, owner, repo, title, issueBody, ['auto-agent', 'bug']);
            return NextResponse.json({ issueNumber: issueData.number, issueUrl: issueData.html_url });
        }

        if (action === 'fix_and_pr') {
            if (!effectiveKey) return NextResponse.json({ error: 'Missing AI API key' }, { status: 400 });

            const { issueNumber, issueTitle, issueBody, targetFile } = body;

            // 1. Fetch current file content
            const fileContent = await fetchFileContent(githubToken, owner, repo, targetFile);

            // 2. Ask AI to generate the fixed file content
            const prompt = `You are an Autonomous AI Agent fixing an issue.
Issue Title: ${issueTitle}
Issue Description: ${issueBody}

Here is the current content of \`${targetFile}\`:
\`\`\`
${fileContent}
\`\`\`

Generate the complete, updated content for \`${targetFile}\` that fixes this issue.
Respond ONLY with the raw file content. Do not wrap it in markdown code blocks. Do not include any explanations. Just the exact string content of the fixed file.`;

            let newContent = '';

            if (effectiveProvider === 'gemini') {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: effectiveKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-pro',
                    contents: prompt,
                });
                newContent = response.text || fileContent;
            } else {
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey: effectiveKey });
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                });
                newContent = response.choices[0]?.message?.content || fileContent;
            }

            // Cleanup potential markdown blocks if the AI disobeyed
            newContent = newContent.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim() + '\n';

            // 3. Create a branch
            const branchName = `auto-agent/fix-issue-${issueNumber}-${Math.random().toString(36).substring(7)}`;
            await createBranch(githubToken, owner, repo, branchName, 'main');

            // 4. Commit the file
            await commitFile(
                githubToken,
                owner,
                repo,
                targetFile,
                `fix: resolve issue #${issueNumber} - ${issueTitle.replace('[Auto Agent] ', '')}`,
                newContent,
                branchName
            );

            // 5. Open PR
            const prData = await createPullRequest(
                githubToken,
                owner,
                repo,
                `Fix: ${issueTitle.replace('[Auto Agent] ', '')}`,
                `This PR was automatically generated by **GitAgent Autonomous Agent** to fix #${issueNumber}.\n\n### Changes Made\n- Applied AI-generated patch to \`${targetFile}\`.\n\nPlease review the changes carefully.`,
                branchName,
                'main'
            );

            return NextResponse.json({
                prNumber: prData.number,
                prUrl: prData.html_url,
                branchUrl: `https://github.com/${owner}/${repo}/tree/${branchName}`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Workflow Step Failed' }, { status: 500 });
    }
}
