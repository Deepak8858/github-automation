'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, CheckCircle2, Circle, AlertCircle, Loader2, GitPullRequest, Search, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Settings {
    githubToken: string;
    geminiApiKey: string;
    openaiApiKey: string;
    copilotApiKey: string;
    activeProvider: 'gemini' | 'openai' | 'copilot';
}

interface LogEntry {
    id: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error' | 'loading';
    message: string;
    details?: string;
    link?: string;
    linkText?: string;
}

export default function AutoAgentPage() {
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        githubToken: '',
        geminiApiKey: '',
        openaiApiKey: '',
        copilotApiKey: '',
        activeProvider: 'gemini'
    });

    const [repoInput, setRepoInput] = useState('');
    const [repos, setRepos] = useState<any[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [steps, setSteps] = useState([
        { id: 'analyze', name: 'Analyze Repository', status: 'idle' as 'idle' | 'running' | 'done' | 'error' },
        { id: 'issue', name: 'Create Issue', status: 'idle' as 'idle' | 'running' | 'done' | 'error' },
        { id: 'fix', name: 'Generate Fix & PR', status: 'idle' as 'idle' | 'running' | 'done' | 'error' },
    ]);

    useEffect(() => {
        setMounted(true);
        const fetchSettingsAndRepos = async () => {
            const savedSettings = localStorage.getItem('gitagent_settings');
            let currentSettings = settings;
            if (savedSettings) {
                try {
                    currentSettings = JSON.parse(savedSettings);
                    setSettings(currentSettings);
                } catch (e) {
                    console.error('Failed to parse settings', e);
                }
            }

            // Try to fetch repos if we have a token or might have a server token
            setIsLoadingRepos(true);
            try {
                const res = await fetch('/api/github/repos', {
                    headers: currentSettings.githubToken ? { 'x-github-token': currentSettings.githubToken } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    setRepos(data);
                }
            } catch (err) {
                console.error("Failed to fetch repos", err);
            } finally {
                setIsLoadingRepos(false);
            }
        };
        fetchSettingsAndRepos();
    }, []);

    const addLog = (type: LogEntry['type'], message: string, options?: { details?: string; link?: string; linkText?: string }) => {
        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substring(7),
            timestamp: new Date(),
            type,
            message,
            ...options
        }]);
    };

    const updateStep = (id: string, status: 'idle' | 'running' | 'done' | 'error') => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };

    const runAgent = async () => {
        if (!repoInput.includes('/')) {
            toast.error('Please enter a valid repository format (owner/repo)');
            return;
        }

        const [owner, repo] = repoInput.split('/');

        // Quick active provider resolution
        const activeKey = settings.activeProvider === 'openai' ? settings.openaiApiKey :
            settings.activeProvider === 'copilot' ? settings.copilotApiKey :
                settings.geminiApiKey;

        setIsRunning(true);
        setLogs([]);
        setSteps(s => s.map(step => ({ ...step, status: 'idle' })));

        addLog('info', `Initializing Autonomous Agent for ${owner}/${repo}...`);

        try {
            // STEP 1: ANALYZE
            updateStep('analyze', 'running');
            addLog('loading', 'Scanning repository for vulnerabilities and bugs...');

            const res = await fetch('/api/ai/autonomous', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'analyze',
                    githubToken: settings.githubToken,
                    provider: settings.activeProvider,
                    apiKey: activeKey,
                    owner,
                    repo
                })
            });

            if (!res.ok) throw new Error((await res.json()).error || 'Failed to analyze repository');
            const analyzeData = await res.json();

            if (!analyzeData.issueFound) {
                updateStep('analyze', 'done');
                addLog('success', 'Repository scan complete. No critical issues found!');
                setIsRunning(false);
                return;
            }

            updateStep('analyze', 'done');
            addLog('info', `Found issue: ${analyzeData.issueTitle}`, { details: analyzeData.issueBody });

            // STEP 2: CREATE ISSUE
            updateStep('issue', 'running');
            addLog('loading', 'Creating tracking issue on GitHub...');

            const issueRes = await fetch('/api/ai/autonomous', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_issue',
                    githubToken: settings.githubToken,
                    owner,
                    repo,
                    title: analyzeData.issueTitle,
                    body: analyzeData.issueBody
                })
            });

            if (!issueRes.ok) throw new Error((await issueRes.json()).error || 'Failed to create issue');
            const issueData = await issueRes.json();

            updateStep('issue', 'done');
            addLog('success', `Created Issue #${issueData.issueNumber}`, {
                link: issueData.issueUrl,
                linkText: 'View Issue on GitHub'
            });

            // STEP 3: FIX & PR
            updateStep('fix', 'running');
            addLog('loading', 'Generating code fix and opening Pull Request...');

            const fixRes = await fetch('/api/ai/autonomous', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fix_and_pr',
                    githubToken: settings.githubToken,
                    provider: settings.activeProvider,
                    apiKey: activeKey,
                    owner,
                    repo,
                    issueNumber: issueData.issueNumber,
                    issueTitle: analyzeData.issueTitle,
                    issueBody: analyzeData.issueBody,
                    targetFile: analyzeData.targetFile
                })
            });

            if (!fixRes.ok) throw new Error((await fixRes.json()).error || 'Failed to create PR');
            const fixData = await fixRes.json();

            updateStep('fix', 'done');
            addLog('success', 'Successfully opened Pull Request!', {
                link: fixData.prUrl,
                linkText: `View PR #${fixData.prNumber} on GitHub`
            });

            addLog('success', '✨ Autonomous Agent workflow completed successfully!');

        } catch (error: any) {
            addLog('error', error.message || 'An unexpected error occurred');
            setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
            toast.error('Autonomous Agent encountered an error');
        } finally {
            setIsRunning(false);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ padding: '32px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #F43F5E, #EC4899, #8B5CF6)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={24} style={{ color: '#F43F5E' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Autonomous Agent</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>AI agent that analyzes, patches, and submits Pull Requests autonomously.</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            title="Repository"
                            type="text"
                            list="repo-list"
                            placeholder={isLoadingRepos ? "Loading repositories..." : "Select or type owner/repo (e.g., facebook/react)"}
                            value={repoInput}
                            onChange={(e) => setRepoInput(e.target.value)}
                            disabled={isRunning}
                            style={{ width: '100%', height: '48px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px 0 44px', color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s', fontSize: '15px' }}
                        />
                        <datalist id="repo-list">
                            {repos.map((repo) => (
                                <option key={repo.id} value={repo.full_name} />
                            ))}
                        </datalist>
                    </div>
                    <button
                        onClick={runAgent}
                        disabled={isRunning || !repoInput}
                        className="btn-primary"
                        style={{ height: '48px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: (isRunning || !repoInput) ? 0.7 : 1 }}
                    >
                        {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                        {isRunning ? 'Agent Running...' : 'Deploy Agent'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Workflow Steps */}
                <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Workflow Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '11px', top: '12px', bottom: '12px', width: '2px', background: 'var(--border-color)', zIndex: 0 }} />

                        {steps.map((step, idx) => (
                            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1 }}>
                                <div style={{ background: 'var(--bg-card)', padding: '2px 0' }}>
                                    {step.status === 'done' ? <CheckCircle2 size={24} style={{ color: 'var(--success)' }} /> :
                                        step.status === 'running' ? <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} /> :
                                            step.status === 'error' ? <AlertCircle size={24} style={{ color: 'var(--warning)' }} /> :
                                                <Circle size={24} style={{ color: 'var(--text-muted)' }} />}
                                </div>
                                <div style={{ paddingTop: '2px' }}>
                                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0, color: step.status === 'idle' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                        {step.name}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                                        {idx === 0 ? 'Find vulnerabilities & bugs' : idx === 1 ? 'Create tracking issue' : 'Write code and open PR'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Console */}
                <div style={{ padding: '24px', borderRadius: '16px', background: '#09090b', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                        <Bot size={16} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>agent-terminal.log</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                        {logs.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px' }}>Waiting for agent deployment...</div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', animation: 'fadeIn 0.3s ease' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#52525b', flexShrink: 0 }}>
                                            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                            {log.type === 'loading' && <Loader2 size={14} className="animate-spin" style={{ color: '#3b82f6', marginTop: '2px' }} />}
                                            {log.type === 'success' && <CheckCircle2 size={14} style={{ color: '#22c55e', marginTop: '2px' }} />}
                                            {log.type === 'error' && <AlertCircle size={14} style={{ color: '#ef4444', marginTop: '2px' }} />}
                                            {log.type === 'warning' && <AlertCircle size={14} style={{ color: '#f59e0b', marginTop: '2px' }} />}
                                            {log.type === 'info' && <span style={{ color: '#3b82f6' }}>›</span>}

                                            <span style={{
                                                color: log.type === 'error' ? '#ef4444' :
                                                    log.type === 'warning' ? '#f59e0b' :
                                                        log.type === 'success' ? '#22c55e' :
                                                            '#e4e4e7',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {log.message}
                                            </span>
                                        </div>
                                    </div>

                                    {log.details && (
                                        <div style={{ marginLeft: '66px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: '#a1a1aa', borderLeft: '2px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-wrap' }}>
                                            {log.details}
                                        </div>
                                    )}
                                    {log.link && (
                                        <a href={log.link} target="_blank" rel="noreferrer" style={{ marginLeft: '66px', color: '#38bdf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            {log.link.includes('pull') ? <GitPullRequest size={14} /> : <FileText size={14} />}
                                            {log.linkText || log.link}
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                        {isRunning && (
                            <div style={{ display: 'flex', gap: '12px', opacity: 0.5 }}>
                                <span style={{ color: '#52525b' }}>--:--:--</span>
                                <span style={{ color: '#3b82f6' }}>_</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
