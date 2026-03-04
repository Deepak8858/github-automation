'use client';

import { useState, useEffect } from 'react';
import {
    GitFork,
    Star,
    AlertCircle,
    ExternalLink,
    Plus,
    Trash2,
    Search,
    RefreshCw,
    Lock,
    Globe,
    Code2,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings, useConnectedRepos, useStats, useActivity } from '../lib/store';
import type { RepoInfo } from '../lib/types';

export default function RepositoriesPage() {
    const { settings } = useSettings();
    const { repos, addRepo, removeRepo } = useConnectedRepos();
    const { incrementStat } = useStats();
    const { addActivity } = useActivity();
    const [repoDetails, setRepoDetails] = useState<Record<string, RepoInfo>>({});
    const [showModal, setShowModal] = useState(false);
    const [repoInput, setRepoInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingAll, setFetchingAll] = useState(false);
    const [userRepos, setUserRepos] = useState<RepoInfo[]>([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (mounted && settings.githubToken && repos.length > 0) {
            repos.forEach(async (fullName) => {
                if (repoDetails[fullName]) return;
                try {
                    const [owner, repo] = fullName.split('/');
                    const res = await fetch(`/api/github/repos?owner=${owner}&repo=${repo}`, {
                        headers: { 'x-github-token': settings.githubToken },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setRepoDetails(prev => ({ ...prev, [fullName]: data }));
                    }
                } catch { /* skip */ }
            });
        }
    }, [mounted, settings.githubToken, repos, repoDetails]);

    const handleAddRepo = async () => {
        if (!repoInput.trim()) return;
        const fullName = repoInput.trim();
        if (!fullName.includes('/')) {
            toast.error('Please enter in format: owner/repo');
            return;
        }
        if (repos.includes(fullName)) {
            toast.error('Repository already connected');
            return;
        }

        setLoading(true);
        try {
            if (settings.githubToken) {
                const [owner, repo] = fullName.split('/');
                const res = await fetch(`/api/github/repos?owner=${owner}&repo=${repo}`, {
                    headers: { 'x-github-token': settings.githubToken },
                });
                if (res.ok) {
                    const data = await res.json();
                    setRepoDetails(prev => ({ ...prev, [fullName]: data }));
                }
            }
            addRepo(fullName);
            incrementStat('reposConnected');
            addActivity({
                type: 'repo-connected',
                title: 'Repository Connected',
                description: `Connected ${fullName}`,
                repo: fullName,
                status: 'success',
            });
            toast.success(`Connected ${fullName}`);
            setRepoInput('');
            setShowModal(false);
        } catch {
            toast.error('Failed to fetch repository');
        }
        setLoading(false);
    };

    const fetchAllRepos = async () => {
        if (!settings.githubToken) {
            toast.error('Please set your GitHub token in Settings first');
            return;
        }
        setFetchingAll(true);
        try {
            const res = await fetch('/api/github/repos', {
                headers: { 'x-github-token': settings.githubToken },
            });
            if (res.ok) {
                const data = await res.json();
                setUserRepos(data);
            } else {
                toast.error('Failed to fetch repos. Check your token.');
            }
        } catch {
            toast.error('Network error');
        }
        setFetchingAll(false);
    };

    const handleRemoveRepo = (fullName: string) => {
        removeRepo(fullName);
        toast.success(`Removed ${fullName}`);
    };

    const filteredConnectedRepos = repos.filter(r =>
        r.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const getLanguageColor = (lang: string | null) => {
        const colors: Record<string, string> = {
            TypeScript: '#3178c6',
            JavaScript: '#f7df1e',
            Python: '#3776ab',
            Java: '#b07219',
            Go: '#00add8',
            Rust: '#dea584',
            Ruby: '#cc342d',
            'C++': '#f34b7d',
            C: '#555555',
            Swift: '#fa7343',
            Kotlin: '#a97bff',
            Dart: '#0175c2',
        };
        return colors[lang || ''] || '#a0a4c4';
    };

    return (
        <div style={{ maxWidth: '1200px' }}>
            {/* Header Actions */}
            <div
                className="animate-fade-in"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '12px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '400px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '8px 16px',
                            flex: 1,
                        }}
                    >
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Filter repositories..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '13px',
                                outline: 'none',
                                width: '100%',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-secondary" onClick={fetchAllRepos} disabled={fetchingAll}>
                        <RefreshCw size={16} className={fetchingAll ? 'animate-spin-slow' : ''} />
                        {fetchingAll ? 'Fetching...' : 'Fetch My Repos'}
                    </button>
                    <button className="btn-gradient" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Add Repository
                    </button>
                </div>
            </div>

            {/* User's repos from GitHub (if fetched) */}
            {userRepos.length > 0 && (
                <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                        Your GitHub Repositories
                    </h3>
                    <div className="grid-auto">
                        {userRepos.slice(0, 12).map((repo) => (
                            <div key={repo.id} className="glass-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {repo.private ? <Lock size={14} style={{ color: 'var(--warning)' }} /> : <Globe size={14} style={{ color: 'var(--success)' }} />}
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{repo.name}</span>
                                    </div>
                                    {!repos.includes(repo.full_name) ? (
                                        <button
                                            className="btn-ghost"
                                            style={{ padding: '4px 12px', fontSize: '12px' }}
                                            onClick={() => {
                                                addRepo(repo.full_name);
                                                incrementStat('reposConnected');
                                                setRepoDetails(prev => ({ ...prev, [repo.full_name]: repo }));
                                                addActivity({
                                                    type: 'repo-connected',
                                                    title: 'Repository Connected',
                                                    description: `Connected ${repo.full_name}`,
                                                    repo: repo.full_name,
                                                    status: 'success',
                                                });
                                                toast.success(`Connected ${repo.full_name}`);
                                            }}
                                        >
                                            <Plus size={14} /> Connect
                                        </button>
                                    ) : (
                                        <span className="badge badge-success">Connected</span>
                                    )}
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                                    {repo.description || 'No description'}
                                </p>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {repo.language && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLanguageColor(repo.language) }} />
                                            {repo.language}
                                        </span>
                                    )}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Star size={12} /> {repo.stargazers_count}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <GitFork size={12} /> {repo.forks_count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Connected Repos */}
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Connected Repositories ({filteredConnectedRepos.length})
            </h3>
            {mounted && filteredConnectedRepos.length > 0 ? (
                <div className="grid-auto">
                    {filteredConnectedRepos.map((fullName, i) => {
                        const details = repoDetails[fullName];
                        return (
                            <div
                                key={fullName}
                                className="glass-card animate-fade-in"
                                style={{ padding: '24px', animationDelay: `${i * 0.05}s`, opacity: 0, animationFillMode: 'forwards' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Code2 size={16} style={{ color: 'var(--accent-secondary)' }} />
                                            <span style={{ fontWeight: 600, fontSize: '15px' }}>{fullName.split('/')[1]}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fullName}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <a
                                            href={`https://github.com/${fullName}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-ghost"
                                            style={{ padding: '6px' }}
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                        <button
                                            className="btn-ghost"
                                            style={{ padding: '6px', color: 'var(--error)' }}
                                            onClick={() => handleRemoveRepo(fullName)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {details && (
                                    <>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                                            {details.description || 'No description'}
                                        </p>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                            {details.language && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getLanguageColor(details.language) }} />
                                                    {details.language}
                                                </span>
                                            )}
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Star size={12} /> {details.stargazers_count}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <AlertCircle size={12} /> {details.open_issues_count} issues
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card empty-state">
                    <GitFork size={48} style={{ opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, fontSize: '16px', marginTop: '12px' }}>No repositories connected</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Connect a repository to start automating your GitHub workflow
                    </p>
                    <button className="btn-gradient" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Add Repository
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Add Repository</h3>
                            <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Repository (owner/repo)
                            </label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="e.g. facebook/react"
                                value={repoInput}
                                onChange={(e) => setRepoInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddRepo()}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn-gradient" onClick={handleAddRepo} disabled={loading}>
                                {loading ? <RefreshCw size={16} className="animate-spin-slow" /> : <Plus size={16} />}
                                {loading ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
