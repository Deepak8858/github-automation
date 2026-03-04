import { NextRequest, NextResponse } from 'next/server';
import { scanCodeForIssues } from '../../../lib/gemini';
import { fetchRepoContents, fetchFileContent } from '../../../lib/github';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { githubToken, geminiApiKey, owner, repo } = body;

        if (!githubToken || !geminiApiKey || !owner || !repo) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch repo root contents
        const contents = await fetchRepoContents(githubToken, owner, repo);

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
                    const content = await fetchFileContent(githubToken, owner, repo, file.path || file.name);
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

        // Send to Gemini for analysis
        const result = await scanCodeForIssues(geminiApiKey, validFiles, `${owner}/${repo}`);

        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Scan failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
