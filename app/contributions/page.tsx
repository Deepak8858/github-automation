'use client';

import { useState, useEffect } from 'react';
import {
    Heart,
    Star,
    GitFork,
    Globe,
    RefreshCw,
    Sparkles,
    Clock,
    Code2,
    BookOpen,
    Wrench,
    TestTube,
    Bug,
    ExternalLink,
    Filter,
    TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings, useStats, useActivity } from '../lib/store';
import type { RepoInfo, ContributionSuggestion } from '../lib/types';

const LANGUAGES = ['All', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'Ruby'];

export default function ContributionsPage() {
    const { settings } = useSettings();
    const { incrementStat } = useStats();
    const { addActivity } = useActivity();
    const [trendingRepos, setTrendingRepos] = useState<RepoInfo[]>([]);
    const [suggestions, setSuggestions] = useState<ContributionSuggestion[]>([]);
    const [selectedLang, setSelectedLang] = useState('All');
    const [loadingTrending, setLoadingTrending] = useState(false);
    const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const fetchTrending = async () => {
        if (!settings.githubToken) {
            toast.error('Please set your GitHub token in Settings');
            return;
        }
        setLoadingTrending(true);
        try {
            const lang = selectedLang === 'All' ? '' : selectedLang;
            const res = await fetch(`/api/github/repos?trending=true&language=${lang}`, {
                headers: { 'x-github-token': settings.githubToken },
            });
            if (res.ok) {
                const data = await res.json();
                setTrendingRepos(data);
            } else {
                toast.error('Failed to fetch trending repos');
            }
        } catch {
            toast.error('Network error');
        }
        setLoadingTrending(false);
    };

    const getActiveAIKey = () => {
        if (settings.activeProvider === 'openai' && settings.openaiApiKey) return { provider: 'openai', key: settings.openaiApiKey };
        if (settings.activeProvider === 'copilot' && settings.copilotApiKey) return { provider: 'copilot', key: settings.copilotApiKey };
        if (settings.geminiApiKey) return { provider: 'gemini', key: settings.geminiApiKey };
        if (settings.openaiApiKey) return { provider: 'openai', key: settings.openaiApiKey };
        return null;
    };

    const analyzeSuggestions = async (repo: RepoInfo) => {
        const aiConfig = getActiveAIKey();
        if (!aiConfig) {
            toast.error('Please set an AI API key in Settings');
            return;
        }
        setAnalyzingRepo(repo.full_name);
        setSuggestions([]);

        try {
            const res = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    geminiApiKey: aiConfig.provider === 'gemini' ? aiConfig.key : undefined,
                    openaiApiKey: aiConfig.provider !== 'gemini' ? aiConfig.key : undefined,
                    provider: aiConfig.provider,
                    repoInfo: {
                        name: repo.full_name,
                        description: repo.description || '',
                        language: repo.language || '',
                    },
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                toast.success(`Found ${data.suggestions?.length || 0} contribution ideas!`);
            } else {
                toast.error('Analysis failed');
            }
        } catch {
            toast.error('Analysis failed');
        }
        setAnalyzingRepo(null);
    };

    const getTypeConfig = (type: string) => {
        const configs: Record<string, { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; color: string }> = {
            'bug-fix': { icon: Bug, color: 'var(--error)' },
            feature: { icon: Sparkles, color: 'var(--accent-secondary)' },
            documentation: { icon: BookOpen, color: 'var(--info)' },
            refactor: { icon: Wrench, color: 'var(--warning)' },
            test: { icon: TestTube, color: 'var(--success)' },
        };
        return configs[type] || configs.feature;
    };

    const getDifficultyColor = (diff: string) => {
        return diff === 'easy' ? 'var(--success)' : diff === 'medium' ? 'var(--warning)' : 'var(--error)';
    };

    const getLanguageColor = (lang: string | null) => {
        const colors: Record<string, string> = {
            TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3776ab',
            Java: '#b07219', Go: '#00add8', Rust: '#dea584', Ruby: '#cc342d',
            'C++': '#f34b7d', Swift: '#fa7343', Kotlin: '#a97bff',
        };
        return colors[lang || ''] || '#a0a4c4';
    };

    if (!mounted) return null;

    return (
        <div style={{ maxWidth: '1200px' }}>
            {/* Search Bar */}
            <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} style={{ color: 'var(--accent-secondary)' }} />
                    Discover Trending Repositories
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang}
                                onClick={() => setSelectedLang(lang)}
                                className={selectedLang === lang ? 'btn-gradient' : 'btn-ghost'}
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                    <button className="btn-gradient" onClick={fetchTrending} disabled={loadingTrending}>
                        {loadingTrending ? <RefreshCw size={14} className="animate-spin-slow" /> : <Globe size={14} />}
                        Search
                    </button>
                </div>
            </div>

            {/* Trending Repos */}
            {loadingTrending ? (
                <div className="grid-auto">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ height: '180px' }} />
                    ))}
                </div>
            ) : trendingRepos.length > 0 ? (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                        Trending Repos ({trendingRepos.length})
                    </h3>
                    <div className="grid-auto">
                        {trendingRepos.map((repo, i) => (
                            <div
                                key={repo.id}
                                className="glass-card animate-fade-in"
                                style={{
                                    padding: '20px',
                                    animationDelay: `${i * 0.05}s`,
                                    opacity: 0,
                                    animationFillMode: 'forwards',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{repo.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{repo.full_name}</p>
                                    </div>
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '4px' }}>
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {repo.description || 'No description'}
                                </p>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
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
                                <button
                                    className="btn-secondary"
                                    style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px' }}
                                    onClick={() => analyzeSuggestions(repo)}
                                    disabled={analyzingRepo === repo.full_name}
                                >
                                    {analyzingRepo === repo.full_name ? (
                                        <><RefreshCw size={14} className="animate-spin-slow" /> Analyzing...</>
                                    ) : (
                                        <><Sparkles size={14} /> Get Contribution Ideas</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* AI Contribution Suggestions */}
            {suggestions.length > 0 && (
                <div className="animate-fade-in">
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
                        Contribution Ideas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {suggestions.map((s, i) => {
                            const config = getTypeConfig(s.type);
                            const Icon = config.icon;
                            return (
                                <div
                                    key={s.id || i}
                                    className="glass-card animate-fade-in"
                                    style={{
                                        padding: '20px',
                                        borderLeft: `3px solid ${config.color}`,
                                        animationDelay: `${i * 0.08}s`,
                                        opacity: 0,
                                        animationFillMode: 'forwards',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <Icon size={18} style={{ color: config.color }} />
                                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.title}</span>
                                            <span className={`badge ${s.type === 'bug-fix' ? 'badge-error' : s.type === 'documentation' ? 'badge-info' : s.type === 'test' ? 'badge-success' : 'badge-warning'}`}>
                                                {s.type}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '12px', color: getDifficultyColor(s.difficulty), fontWeight: 600 }}>
                                                {s.difficulty}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> {s.estimatedTime}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
                                        {s.description}
                                    </p>
                                    {s.files && s.files.length > 0 && (
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {s.files.map((f, fi) => (
                                                <span key={fi} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '6px' }}>
                                                    <Code2 size={10} /> {f}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loadingTrending && trendingRepos.length === 0 && suggestions.length === 0 && (
                <div className="glass-card empty-state">
                    <Heart size={48} style={{ opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, fontSize: '16px', marginTop: '12px' }}>Discover Open Source</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Search for trending repos and let AI suggest ways to contribute
                    </p>
                    <button className="btn-gradient" onClick={fetchTrending}>
                        <Globe size={16} /> Browse Trending
                    </button>
                </div>
            )}
        </div>
    );
}
