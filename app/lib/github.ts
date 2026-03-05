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

export async function createBranch(token: string, owner: string, repo: string, newBranchName: string, baseBranch: string = 'main') {
    const octokit = createOctokit(token);

    // Get the SHA of the base branch
    const baseRef = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`,
    }).catch(async () => {
        // Fallback to master if main doesn't exist
        if (baseBranch === 'main') {
            return await octokit.rest.git.getRef({
                owner,
                repo,
                ref: 'heads/master',
            });
        }
        throw new Error(`Base branch ${baseBranch} not found`);
    });

    const sha = baseRef.data.object.sha;

    // Create a new reference (branch)
    const { data } = await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranchName}`,
        sha,
    });

    return data;
}

export async function commitFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    message: string,
    content: string,
    branch: string
) {
    const octokit = createOctokit(token);

    // We need to fetch the file first to get its SHA so we can update it
    let sha: string | undefined = undefined;
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        if (!Array.isArray(data) && data.type === 'file') {
            sha = data.sha;
        }
    } catch {
        // File doesn't exist yet, which is fine for new files
    }

    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
    });

    return data;
}

export async function fetchUserProfile(token: string) {
    const octokit = createOctokit(token);
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
}

export async function fetchUserBadgeStats(token: string) {
    const octokit = createOctokit(token);
    const user = await fetchUserProfile(token);

    // Fetch repos with star counts
    const repos = await fetchUserRepos(token);
    const totalStars = repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum: number, r: any) => sum + (r.forks_count || 0), 0);

    // Fetch recent PRs authored by the user
    let prCount = 0;
    try {
        const { data: prSearch } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr`,
            per_page: 1,
        });
        prCount = prSearch.total_count;
    } catch { /* ignore */ }

    // Fetch recent issues authored by the user
    let issueCount = 0;
    try {
        const { data: issueSearch } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:issue`,
            per_page: 1,
        });
        issueCount = issueSearch.total_count;
    } catch { /* ignore */ }

    return {
        login: user.login,
        avatarUrl: user.avatar_url,
        name: user.name || user.login,
        bio: user.bio,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        publicGists: user.public_gists || 0,
        totalStars,
        totalForks,
        prCount,
        issueCount,
        createdAt: user.created_at,
    };
}
