import { NextRequest, NextResponse } from 'next/server';
import { fetchFileContent, fetchRepoContents, createBranch, commitFile, createPullRequest, forkRepo, createIssue } from '../../../lib/github';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, githubToken, provider, apiKey, owner, repo, suggestion } = body;

        if (!githubToken || !owner || !repo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!apiKey) {
            return NextResponse.json({ error: 'Missing AI API key' }, { status: 400 });
        }

        if (action === 'auto_contribute') {
            // Step 1: Fork the repo
            let forkOwner: string;
            try {
                const forkData = await forkRepo(githubToken, owner, repo);
                forkOwner = forkData.owner.login;
                // Wait for fork to be ready
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (err: any) {
                // Fork may already exist
                const { fetchUserProfile } = await import('../../../lib/github');
                const user = await fetchUserProfile(githubToken);
                forkOwner = user.login;
            }

            // Step 2: Fetch repo contents to find relevant files
            const contents = await fetchRepoContents(githubToken, forkOwner, repo);
            const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.md'];
            let targetFiles: any[] = [];
            if (Array.isArray(contents)) {
                targetFiles = contents.filter((item: any) =>
                    item.type === 'file' && codeExtensions.some(ext => item.name.endsWith(ext))
                ).slice(0, 3);
            }

            // Step 3: Pick target file based on suggestion and fetch its content
            let targetFilePath = '';
            let fileContent = '';

            if (suggestion?.files?.length > 0) {
                // Try to fetch the first suggested file
                for (const f of suggestion.files) {
                    try {
                        fileContent = await fetchFileContent(githubToken, forkOwner, repo, f);
                        targetFilePath = f;
                        break;
                    } catch { /* file not found, try next */ }
                }
            }

            if (!targetFilePath && targetFiles.length > 0) {
                targetFilePath = targetFiles[0].path;
                fileContent = await fetchFileContent(githubToken, forkOwner, repo, targetFilePath);
            }

            if (!targetFilePath) {
                return NextResponse.json({ error: 'No suitable files found in repository' }, { status: 400 });
            }

            // Step 4: Ask AI to generate the contribution
            const prompt = `You are an AI agent making an autonomous open-source contribution.

Repository: ${owner}/${repo}
Contribution type: ${suggestion?.type || 'improvement'}
Title: ${suggestion?.title || 'Code improvement'}
Description: ${suggestion?.description || 'General improvement based on best practices'}

Here is the current content of \`${targetFilePath}\`:
\`\`\`
${fileContent.substring(0, 12000)}
\`\`\`

Generate the complete, updated content for \`${targetFilePath}\` that implements this contribution.
Make meaningful, professional changes. Focus on:
- ${suggestion?.type === 'bug-fix' ? 'Fixing bugs and edge cases' : ''}
- ${suggestion?.type === 'documentation' ? 'Improving documentation, adding JSDoc comments, and README improvements' : ''}
- ${suggestion?.type === 'test' ? 'Adding unit tests and test coverage' : ''}
- ${suggestion?.type === 'refactor' ? 'Improving code structure, readability, and performance' : ''}
- ${suggestion?.type === 'feature' ? 'Adding the described feature with clean implementation' : ''}

Respond ONLY with the raw file content. Do not wrap it in markdown code blocks. Do not include any explanations.`;

            let newContent = '';

            if (provider === 'gemini') {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: prompt,
                });
                newContent = response.text || fileContent;
            } else {
                const OpenAI = (await import('openai')).default;
                const openai = new OpenAI({ apiKey });
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                });
                newContent = response.choices[0]?.message?.content || fileContent;
            }

            // Cleanup potential markdown blocks
            newContent = newContent.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim() + '\n';

            // Step 5: Create branch on fork
            const branchName = `auto-contribute/${(suggestion?.type || 'improve')}-${Math.random().toString(36).substring(2, 8)}`;
            await createBranch(githubToken, forkOwner, repo, branchName, 'main');

            // Step 6: Commit the change
            const commitTitle = suggestion?.title || 'Autonomous code improvement';
            await commitFile(
                githubToken, forkOwner, repo, targetFilePath,
                `${suggestion?.type === 'bug-fix' ? 'fix' : suggestion?.type === 'feature' ? 'feat' : 'chore'}: ${commitTitle}`,
                newContent, branchName
            );

            // Step 7: Open PR from fork to original repo
            const prData = await createPullRequest(
                githubToken, owner, repo,
                `${suggestion?.type === 'bug-fix' ? '🐛' : suggestion?.type === 'feature' ? '✨' : suggestion?.type === 'documentation' ? '📝' : suggestion?.type === 'test' ? '🧪' : '♻️'} ${commitTitle}`,
                `## Autonomous Contribution\n\n**Type:** ${suggestion?.type || 'improvement'}\n**Difficulty:** ${suggestion?.difficulty || 'medium'}\n\n### Description\n${suggestion?.description || 'AI-generated improvement'}\n\n### Changes\n- Modified \`${targetFilePath}\`\n\n---\n*🤖 This PR was autonomously generated by GitAgent AI*`,
                `${forkOwner}:${branchName}`,
                'main'
            );

            return NextResponse.json({
                success: true,
                prNumber: prData.number,
                prUrl: prData.html_url,
                forkUrl: `https://github.com/${forkOwner}/${repo}`,
                branchName,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Auto-contribute failed' }, { status: 500 });
    }
}
