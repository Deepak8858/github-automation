import { Octokit } from 'octokit';

export function createOctokit(token: string) {
    return new Octokit({ auth: token });
}

export async function fetchUserRepos(token: string) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        type: 'all',
    });
    return data;
}

export async function fetchRepoDetails(token: string, owner: string, repo: string) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return data;
}

export async function fetchPullRequests(token: string, owner: string, repo: string) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page: 30,
    });
    return data;
}

export async function fetchPRDiff(token: string, owner: string, repo: string, pullNumber: number) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: { format: 'diff' },
    });
    return data as unknown as string;
}

export async function fetchIssues(token: string, owner: string, repo: string) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 30,
    });
    return data.filter(issue => !issue.pull_request);
}

export async function createIssue(
    token: string,
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels: string[] = []
) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
    });
    return data;
}

export async function createPRReviewComment(
    token: string,
    owner: string,
    repo: string,
    pullNumber: number,
    body: string,
    commitId: string,
    path: string,
    line: number
) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.pulls.createReviewComment({
        owner,
        repo,
        pull_number: pullNumber,
        body,
        commit_id: commitId,
        path,
        line,
    });
    return data;
}

export async function fetchRepoContents(
    token: string,
    owner: string,
    repo: string,
    path: string = ''
) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
    });
    return data;
}

export async function fetchFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string
) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
    });
    if (!Array.isArray(data) && data.type === 'file' && 'content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    throw new Error('Not a file');
}

export async function forkRepo(token: string, owner: string, repo: string) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.repos.createFork({ owner, repo });
    return data;
}

export async function createPullRequest(
    token: string,
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
    });
    return data;
}

export async function searchTrendingRepos(token: string, language?: string) {
    const octokit = createOctokit(token);
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const since = date.toISOString().split('T')[0];

    let q = `created:>${since} stars:>10`;
    if (language) q += ` language:${language}`;

    const { data } = await octokit.rest.search.repos({
        q,
        sort: 'stars',
        order: 'desc',
        per_page: 20,
    });
    return data.items;
}
