import { NextRequest, NextResponse } from 'next/server';
import { scanCodeForIssues } from '../../../lib/gemini';
import { scanCodeForIssuesOpenAI } from '../../../lib/openai';
import { fetchRepoContents, fetchFileContent } from '../../../lib/github';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { githubToken, geminiApiKey, openaiApiKey, provider, owner, repo } = body;

        const effectiveProvider = provider || (openaiApiKey ? 'openai' : 'gemini');
        let effectiveKey = effectiveProvider === 'gemini' ? (geminiApiKey || process.env.GEMINI_API_KEY || '') : (openaiApiKey || process.env.OPENAI_API_KEY || '');
        if (effectiveProvider === 'copilot' && !effectiveKey) {
            effectiveKey = process.env.COPILOT_API_KEY || '';
        }

        const effectiveGithubToken = githubToken || process.env.GITHUB_TOKEN;

        if (!effectiveGithubToken || !effectiveKey || !owner || !repo) {
            return NextResponse.json({ error: 'Missing required fields (GitHub token + an AI API key)' }, { status: 400 });
        }

        // Fetch repo root contents
        const contents = await fetchRepoContents(effectiveGithubToken, owner, repo);

        if (!Array.isArray(contents)) {
            return NextResponse.json({ error: 'Could not list repo contents' }, { status: 500 });
        }

        // Filter for code files (limit to manageable number)
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.cpp', '.c', '.cs'];
        const codeFiles = contents
            .filter((item: { type: string; name: string }) => {
                if (item.type !== 'file') return false;
                return codeExtensions.some(ext => item.name.endsWith(ext));
            })
            .slice(0, 8);

        // Fetch file contents
        const filesWithContent = await Promise.all(
            codeFiles.map(async (file: { name: string; path?: string }) => {
                try {
                    const content = await fetchFileContent(effectiveGithubToken, owner, repo, file.path || file.name);
                    return { path: file.name, content };
                } catch {
                    return null;
                }
            })
        );

        const validFiles = filesWithContent.filter((f): f is { path: string; content: string } => f !== null);

        if (validFiles.length === 0) {
            return NextResponse.json({
                totalIssues: 0,
                criticalCount: 0,
                highCount: 0,
                mediumCount: 0,
                lowCount: 0,
                issues: [],
            });
        }

        // Send to AI for analysis
        let result;
        if (effectiveProvider === 'gemini') {
            result = await scanCodeForIssues(effectiveKey, validFiles, `${owner}/${repo}`);
        } else {
            result = await scanCodeForIssuesOpenAI(effectiveKey, validFiles, `${owner}/${repo}`);
        }

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Scan failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
