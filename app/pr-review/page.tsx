'use client';

import { useState, useEffect } from 'react';
import {
    GitPullRequest,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    RefreshCw,
    ChevronRight,
    FileCode,
    ThumbsUp,
    Info,
    X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings, useConnectedRepos, useStats, useActivity } from '../lib/store';
import type { PullRequest, AIReviewResult } from '../lib/types';

export default function PRReviewPage() {
    const { settings } = useSettings();
    const { repos } = useConnectedRepos();
    const { incrementStat } = useStats();
    const { addActivity } = useActivity();
    const [selectedRepo, setSelectedRepo] = useState('');
    const [prs, setPrs] = useState<PullRequest[]>([]);
    const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
    const [review, setReview] = useState<AIReviewResult | null>(null);
    const [loadingPRs, setLoadingPRs] = useState(false);
    const [reviewing, setReviewing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const fetchPRs = async (repoFullName: string) => {
        if (!settings.githubToken) {
            toast.error('Please set your GitHub token in Settings');
            return;
        }
        setLoadingPRs(true);
        setSelectedRepo(repoFullName);
        setPrs([]);
        setSelectedPR(null);
        setReview(null);

        try {
            const [owner, repo] = repoFullName.split('/');
            const res = await fetch(`/api/github/prs?owner=${owner}&repo=${repo}`, {
                headers: { 'x-github-token': settings.githubToken },
            });
            if (res.ok) {
                const data = await res.json();
                setPrs(data);
                if (data.length === 0) toast('No open PRs found', { icon: 'ℹ️' });
            } else {
                toast.error('Failed to fetch PRs');
            }
        } catch {
            toast.error('Network error');
        }
        setLoadingPRs(false);
    };

    const getActiveAIKey = () => {
        if (settings.activeProvider === 'openai' && settings.openaiApiKey) return { provider: 'openai', key: settings.openaiApiKey };
        if (settings.activeProvider === 'copilot' && settings.copilotApiKey) return { provider: 'copilot', key: settings.copilotApiKey };
        if (settings.geminiApiKey) return { provider: 'gemini', key: settings.geminiApiKey };
        if (settings.openaiApiKey) return { provider: 'openai', key: settings.openaiApiKey };
        return null;
    };

    const runReview = async (pr: PullRequest) => {
        const aiConfig = getActiveAIKey();
        if (!aiConfig) {
            toast.error('Please set an AI API key in Settings');
            return;
        }
        setSelectedPR(pr);
        setReviewing(true);
        setReview(null);

        try {
            const res = await fetch('/api/ai/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    githubToken: settings.githubToken,
                    geminiApiKey: aiConfig.provider === 'gemini' ? aiConfig.key : undefined,
                    openaiApiKey: aiConfig.provider !== 'gemini' ? aiConfig.key : undefined,
                    provider: aiConfig.provider,
                    apiKey: aiConfig.key,
                    owner: selectedRepo.split('/')[0],
                    repo: selectedRepo.split('/')[1],
                    pullNumber: pr.number,
                    prTitle: pr.title,
                    prDescription: pr.body || '',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setReview(data);
                incrementStat('prsReviewed');
                addActivity({
                    type: 'pr-review',
                    title: `Reviewed PR #${pr.number}`,
                    description: `${pr.title} in ${selectedRepo}`,
                    repo: selectedRepo,
                    status: 'success',
                    url: pr.html_url,
                });
                toast.success('Review complete!');
            } else {
                const err = await res.json();
                toast.error(err.error || 'Review failed');
            }
        } catch {
            toast.error('Review failed');
        }
        setReviewing(false);
    };

    const getSeverityConfig = (severity: string) => {
        const configs: Record<string, { color: string; bg: string; icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }> = {
            critical: { color: 'var(--error)', bg: 'rgba(255,107,107,0.1)', icon: AlertTriangle },
            warning: { color: 'var(--warning)', bg: 'rgba(253,203,110,0.1)', icon: AlertTriangle },
            suggestion: { color: 'var(--info)', bg: 'rgba(116,185,255,0.1)', icon: Info },
            praise: { color: 'var(--success)', bg: 'rgba(0,206,201,0.1)', icon: ThumbsUp },
        };
        return configs[severity] || configs.suggestion;
    };

    if (!mounted) return null;

    return (
        <div style={{ maxWidth: '1200px' }}>
            {/* Step 1: Select Repo */}
            <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>1</span>
                    Select Repository
                </h3>
                {repos.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {repos.map((repo) => (
                            <button
                                key={repo}
                                onClick={() => fetchPRs(repo)}
                                className={selectedRepo === repo ? 'btn-gradient' : 'btn-secondary'}
                                style={{ fontSize: '13px' }}
                            >
                                {repo}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        No repositories connected. <a href="/repositories" style={{ color: 'var(--accent-secondary)' }}>Add one first</a>.
                    </p>
                )}
            </div>

            {/* Step 2: Select PR */}
            {selectedRepo && (
                <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: prs.length > 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</span>
                        Select Pull Request
                        {loadingPRs && <RefreshCw size={16} className="animate-spin-slow" style={{ color: 'var(--accent-secondary)' }} />}
                    </h3>
                    {loadingPRs ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px' }} />)}
                        </div>
                    ) : prs.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {prs.map((pr) => (
                                <button
                                    key={pr.id}
                                    onClick={() => runReview(pr)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '16px',
                                        background: selectedPR?.id === pr.id ? 'rgba(108,92,231,0.1)' : 'var(--bg-tertiary)',
                                        border: `1px solid ${selectedPR?.id === pr.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textAlign: 'left',
                                        width: '100%',
                                        fontFamily: 'inherit',
                                        color: 'var(--text-primary)',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = selectedPR?.id === pr.id ? 'var(--accent-primary)' : 'var(--border-color)';
                                    }}
                                >
                                    <GitPullRequest size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                            #{pr.number} {pr.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            by {pr.user.login} • {pr.head.ref} → {pr.base.ref}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                </button>
                            ))}
                        </div>
                    ) : !loadingPRs ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No open pull requests found.</p>
                    ) : null}
                </div>
            )}

            {/* Step 3: Review Results */}
            {(reviewing || review) && (
                <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>3</span>
                        AI Review
                        {reviewing && <RefreshCw size={16} className="animate-spin-slow" style={{ color: 'var(--accent-secondary)' }} />}
                    </h3>

                    {reviewing ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <Sparkles size={40} style={{ color: 'var(--accent-secondary)', marginBottom: '16px' }} className="animate-pulse-glow" />
                            <p style={{ fontWeight: 600, fontSize: '16px' }}>Analyzing PR with Gemini AI...</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                This may take a moment
                            </p>
                        </div>
                    ) : review ? (
                        <>
                            {/* Summary */}
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: '20px',
                                marginBottom: '20px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Overall Rating</span>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}>
                                        <div style={{
                                            width: '120px',
                                            height: '8px',
                                            background: 'var(--bg-primary)',
                                            borderRadius: '4px',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                width: `${review.overallRating * 10}%`,
                                                height: '100%',
                                                background: review.overallRating >= 7 ? 'var(--success)' : review.overallRating >= 4 ? 'var(--warning)' : 'var(--error)',
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                        <span style={{ fontWeight: 700, fontSize: '18px', color: review.overallRating >= 7 ? 'var(--success)' : review.overallRating >= 4 ? 'var(--warning)' : 'var(--error)' }}>
                                            {review.overallRating}/10
                                        </span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                    {review.summary}
                                </p>
                            </div>

                            {/* Comments */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {review.comments.map((comment, i) => {
                                    const config = getSeverityConfig(comment.severity);
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                background: config.bg,
                                                borderRadius: 'var(--radius-md)',
                                                padding: '16px',
                                                borderLeft: `3px solid ${config.color}`,
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Icon size={16} style={{ color: config.color }} />
                                                <span className={`badge badge-${comment.severity === 'critical' ? 'error' : comment.severity === 'warning' ? 'warning' : comment.severity === 'praise' ? 'success' : 'info'}`}>
                                                    {comment.severity}
                                                </span>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FileCode size={12} /> {comment.file}:{comment.line}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                                                {comment.comment}
                                            </p>
                                            {comment.suggestedFix && (
                                                <div className="code-block" style={{ marginTop: '12px', fontSize: '12px' }}>
                                                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px' }}>Suggested Fix:</div>
                                                    <code style={{ color: 'var(--success)', whiteSpace: 'pre-wrap' }}>
                                                        {comment.suggestedFix}
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}
