'use client';

import { useState, useEffect } from 'react';
import {
    Settings,
    Key,
    Github,
    Sparkles,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Eye,
    EyeOff,
    Save,
    Trash2,
    Shield,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../lib/store';

export default function SettingsPage() {
    const { settings, setSettings, loaded } = useSettings();
    const [showGithubToken, setShowGithubToken] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [githubStatus, setGithubStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [geminiStatus, setGeminiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [localGithubToken, setLocalGithubToken] = useState('');
    const [localGeminiKey, setLocalGeminiKey] = useState('');

    useEffect(() => {
        if (loaded) {
            setLocalGithubToken(settings.githubToken);
            setLocalGeminiKey(settings.geminiApiKey);
        }
    }, [loaded, settings.githubToken, settings.geminiApiKey]);

    const testGithub = async () => {
        if (!localGithubToken) {
            toast.error('Please enter a GitHub token');
            return;
        }
        setGithubStatus('testing');
        try {
            const res = await fetch('/api/github/repos', {
                headers: { 'x-github-token': localGithubToken },
            });
            if (res.ok) {
                setGithubStatus('success');
                toast.success('GitHub connection successful!');
            } else {
                setGithubStatus('error');
                toast.error('Invalid GitHub token');
            }
        } catch {
            setGithubStatus('error');
            toast.error('Connection failed');
        }
    };

    const testGemini = async () => {
        if (!localGeminiKey) {
            toast.error('Please enter a Gemini API key');
            return;
        }
        setGeminiStatus('testing');
        try {
            const res = await fetch('/api/ai/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    geminiApiKey: localGeminiKey,
                    testConnection: true,
                }),
            });
            if (res.ok) {
                setGeminiStatus('success');
                toast.success('Gemini connection successful!');
            } else {
                setGeminiStatus('error');
                toast.error('Invalid Gemini API key');
            }
        } catch {
            setGeminiStatus('error');
            toast.error('Connection failed');
        }
    };

    const handleSave = () => {
        setSettings({
            githubToken: localGithubToken,
            geminiApiKey: localGeminiKey,
        });
        toast.success('Settings saved!');
    };

    const handleClear = () => {
        setLocalGithubToken('');
        setLocalGeminiKey('');
        setSettings({
            githubToken: '',
            geminiApiKey: '',
            autoReview: false,
            autoFix: false,
            scanSchedule: 'manual',
        });
        setGithubStatus('idle');
        setGeminiStatus('idle');
        toast.success('Settings cleared');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'testing': return <RefreshCw size={16} className="animate-spin-slow" style={{ color: 'var(--accent-secondary)' }} />;
            case 'success': return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
            case 'error': return <XCircle size={16} style={{ color: 'var(--error)' }} />;
            default: return null;
        }
    };

    if (!loaded) return null;

    return (
        <div style={{ maxWidth: '720px' }}>
            {/* API Keys */}
            <div className="glass-card animate-fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Key size={20} style={{ color: 'var(--accent-secondary)' }} />
                    API Configuration
                </h3>

                {/* GitHub Token */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                    }}>
                        <Github size={16} />
                        GitHub Personal Access Token
                        {getStatusIcon(githubStatus)}
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Required for repository access. Generate at{' '}
                        <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)' }}>
                            GitHub Settings → Tokens
                        </a>
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                className="input-field"
                                type={showGithubToken ? 'text' : 'password'}
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                value={localGithubToken}
                                onChange={(e) => {
                                    setLocalGithubToken(e.target.value);
                                    setGithubStatus('idle');
                                }}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                onClick={() => setShowGithubToken(!showGithubToken)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                }}
                            >
                                {showGithubToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={testGithub}
                            disabled={githubStatus === 'testing'}
                            style={{ flexShrink: 0 }}
                        >
                            {githubStatus === 'testing' ? 'Testing...' : 'Test'}
                        </button>
                    </div>
                </div>

                {/* Gemini API Key */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                    }}>
                        <Sparkles size={16} />
                        Google Gemini API Key
                        {getStatusIcon(geminiStatus)}
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Required for AI-powered features. Get yours at{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)' }}>
                            Google AI Studio
                        </a>
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                className="input-field"
                                type={showGeminiKey ? 'text' : 'password'}
                                placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx"
                                value={localGeminiKey}
                                onChange={(e) => {
                                    setLocalGeminiKey(e.target.value);
                                    setGeminiStatus('idle');
                                }}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                }}
                            >
                                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button
                            className="btn-secondary"
                            onClick={testGemini}
                            disabled={geminiStatus === 'testing'}
                            style={{ flexShrink: 0 }}
                        >
                            {geminiStatus === 'testing' ? 'Testing...' : 'Test'}
                        </button>
                    </div>
                </div>

                {/* Save / Clear */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn-danger" onClick={handleClear}>
                        <Trash2 size={14} /> Clear All
                    </button>
                    <button className="btn-gradient" onClick={handleSave}>
                        <Save size={14} /> Save Settings
                    </button>
                </div>
            </div>

            {/* Preferences */}
            <div className="glass-card animate-fade-in delay-200" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings size={20} style={{ color: 'var(--accent-secondary)' }} />
                    Automation Preferences
                </h3>

                {/* Toggle: Auto Review */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Auto-Review PRs</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                            Automatically review new pull requests when they are opened
                        </p>
                    </div>
                    <button
                        onClick={() => setSettings({ autoReview: !settings.autoReview })}
                        style={{
                            width: '48px',
                            height: '26px',
                            borderRadius: '13px',
                            background: settings.autoReview ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            border: `1px solid ${settings.autoReview ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            padding: 0,
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: '2px',
                            left: settings.autoReview ? '25px' : '2px',
                            transition: 'left 0.3s ease',
                        }} />
                    </button>
                </div>

                {/* Toggle: Auto Fix */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Auto-Fix Issues</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                            Automatically create fix PRs for discovered issues
                        </p>
                    </div>
                    <button
                        onClick={() => setSettings({ autoFix: !settings.autoFix })}
                        style={{
                            width: '48px',
                            height: '26px',
                            borderRadius: '13px',
                            background: settings.autoFix ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            border: `1px solid ${settings.autoFix ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            padding: 0,
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: '2px',
                            left: settings.autoFix ? '25px' : '2px',
                            transition: 'left 0.3s ease',
                        }} />
                    </button>
                </div>

                {/* Scan Schedule */}
                <div style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Scan Schedule</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['manual', 'daily', 'weekly'] as const).map(schedule => (
                            <button
                                key={schedule}
                                className={settings.scanSchedule === schedule ? 'btn-gradient' : 'btn-secondary'}
                                style={{ textTransform: 'capitalize', fontSize: '13px' }}
                                onClick={() => setSettings({ scanSchedule: schedule })}
                            >
                                {schedule}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Note */}
            <div
                className="glass-card animate-fade-in delay-400"
                style={{
                    padding: '20px',
                    borderLeft: '3px solid var(--warning)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={16} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Security Note</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    API keys are stored locally in your browser&apos;s localStorage. They are never sent to any third-party servers
                    — only directly to the GitHub API and Google Gemini API. For production use, consider implementing
                    proper OAuth authentication and server-side key storage.
                </p>
            </div>
        </div>
    );
}
