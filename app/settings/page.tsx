'use client';

import { useState, useEffect } from 'react';
import {
    Settings, Key, Github, Sparkles, CheckCircle2, XCircle, RefreshCw,
    Eye, EyeOff, Save, Trash2, Shield, Clock, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../lib/store';
import { AI_PROVIDERS } from '../lib/ai-providers';

export default function SettingsPage() {
    const { settings, setSettings, loaded } = useSettings();
    const [showGithubToken, setShowGithubToken] = useState(false);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [keyStatuses, setKeyStatuses] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
    const [githubStatus, setGithubStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [localGithubToken, setLocalGithubToken] = useState('');
    const [localKeys, setLocalKeys] = useState<Record<string, string>>({});

    useEffect(() => {
        if (loaded) {
            setLocalGithubToken(settings.githubToken);
            const keys: Record<string, string> = {};
            AI_PROVIDERS.forEach(p => {
                keys[p.id] = (settings[p.keyName] as string) || '';
            });
            setLocalKeys(keys);
        }
    }, [loaded, settings]);

    const testGithub = async () => {
        if (!localGithubToken) { toast.error('Enter a GitHub token'); return; }
        setGithubStatus('testing');
        try {
            const res = await fetch('/api/github/repos', { headers: { 'x-github-token': localGithubToken } });
            if (res.ok) { setGithubStatus('success'); toast.success('GitHub connected!'); }
            else { setGithubStatus('error'); toast.error('Invalid token'); }
        } catch { setGithubStatus('error'); toast.error('Connection failed'); }
    };

    const testProvider = async (providerId: string) => {
        const key = localKeys[providerId];
        if (!key) { toast.error('Enter an API key'); return; }
        setKeyStatuses(s => ({ ...s, [providerId]: 'testing' }));
        try {
            const res = await fetch('/api/ai/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testConnection: true,
                    geminiApiKey: providerId === 'gemini' ? key : undefined,
                    openaiApiKey: providerId === 'openai' ? key : undefined,
                    provider: providerId,
                    apiKey: key,
                }),
            });
            if (res.ok) { setKeyStatuses(s => ({ ...s, [providerId]: 'success' })); toast.success('Connected!'); }
            else { setKeyStatuses(s => ({ ...s, [providerId]: 'error' })); toast.error('Invalid key'); }
        } catch { setKeyStatuses(s => ({ ...s, [providerId]: 'error' })); toast.error('Failed'); }
    };

    const handleSave = () => {
        const update: Record<string, string> = { githubToken: localGithubToken };
        AI_PROVIDERS.forEach(p => { update[p.keyName] = localKeys[p.id] || ''; });
        setSettings(update);
        toast.success('Settings saved!');
    };

    const handleClear = () => {
        setLocalGithubToken('');
        setLocalKeys({});
        const update: Record<string, string | boolean> = { githubToken: '', autoReview: false, autoFix: false, scanSchedule: 'manual' };
        AI_PROVIDERS.forEach(p => { update[p.keyName] = ''; });
        setSettings(update);
        setGithubStatus('idle');
        setKeyStatuses({});
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
        <form onSubmit={e => e.preventDefault()} autoComplete="off" style={{ maxWidth: '760px' }}>
            {/* GitHub Token */}
            <div className="glass-card animate-fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Github size={20} /> GitHub Configuration
                </h3>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        <Key size={16} /> Personal Access Token {getStatusIcon(githubStatus)}
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Required for repository access.{' '}
                        <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)' }}>GitHub Settings → Tokens</a>
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input className="input-field" type={showGithubToken ? 'text' : 'password'} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value={localGithubToken}
                                onChange={e => { setLocalGithubToken(e.target.value); setGithubStatus('idle'); }} style={{ paddingRight: '40px' }} />
                            <button onClick={() => setShowGithubToken(!showGithubToken)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                {showGithubToken ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button className="btn-secondary" onClick={testGithub} disabled={githubStatus === 'testing'} style={{ flexShrink: 0 }}>
                            {githubStatus === 'testing' ? 'Testing...' : 'Test'}
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Provider Keys */}
            <div className="glass-card animate-fade-in delay-100" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} style={{ color: 'var(--accent-secondary)' }} /> AI Provider Configuration
                </h3>

                {AI_PROVIDERS.map((provider, i) => (
                    <div key={provider.id} style={{ marginBottom: i < AI_PROVIDERS.length - 1 ? '28px' : '0', paddingBottom: i < AI_PROVIDERS.length - 1 ? '24px' : '0', borderBottom: i < AI_PROVIDERS.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: provider.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: 'white' }}>
                                {provider.icon}
                            </div>
                            <div>
                                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {provider.name} {getStatusIcon(keyStatuses[provider.id] || 'idle')}
                                    {settings.activeProvider === provider.id && (
                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: `${provider.color}20`, color: provider.color, fontWeight: 700 }}>ACTIVE</span>
                                    )}
                                </label>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{provider.description}</p>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', marginTop: '8px' }}>
                            Get your API key at{' '}
                            <a href={provider.helpUrl} target="_blank" rel="noopener noreferrer" style={{ color: provider.color }}>{provider.helpLabel}</a>
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input className="input-field" type={showKeys[provider.id] ? 'text' : 'password'} placeholder={provider.keyPlaceholder}
                                    value={localKeys[provider.id] || ''}
                                    onChange={e => { setLocalKeys(k => ({ ...k, [provider.id]: e.target.value })); setKeyStatuses(s => ({ ...s, [provider.id]: 'idle' })); }}
                                    style={{ paddingRight: '40px', borderColor: localKeys[provider.id] ? `${provider.color}40` : undefined }} />
                                <button onClick={() => setShowKeys(s => ({ ...s, [provider.id]: !s[provider.id] }))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                    {showKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <button className="btn-secondary" onClick={() => testProvider(provider.id)} disabled={keyStatuses[provider.id] === 'testing'} style={{ flexShrink: 0 }}>
                                {keyStatuses[provider.id] === 'testing' ? 'Testing...' : 'Test'}
                            </button>
                            <button onClick={() => setSettings({ activeProvider: provider.id as 'gemini' | 'openai' | 'copilot' })}
                                style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)', border: settings.activeProvider === provider.id ? `2px solid ${provider.color}` : '1px solid var(--border-color)', background: settings.activeProvider === provider.id ? `${provider.color}15` : 'var(--bg-tertiary)', color: settings.activeProvider === provider.id ? provider.color : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, flexShrink: 0, transition: 'all 0.2s' }}>
                                {settings.activeProvider === provider.id ? '✓ Active' : 'Set Active'}
                            </button>
                        </div>

                        {/* Model list */}
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '24px' }}>Models:</span>
                            {provider.models.map(m => (
                                <span key={m} style={{ padding: '2px 10px', borderRadius: '10px', background: `${provider.color}10`, color: provider.color, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{m}</span>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Save / Clear */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', marginTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn-danger" onClick={handleClear}><Trash2 size={14} /> Clear All</button>
                    <button className="btn-gradient" onClick={handleSave}><Save size={14} /> Save Settings</button>
                </div>
            </div>

            {/* Automation Preferences */}
            <div className="glass-card animate-fade-in delay-200" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Settings size={20} style={{ color: 'var(--accent-secondary)' }} /> Automation Preferences
                </h3>

                {[
                    { key: 'autoReview' as const, label: 'Auto-Review PRs', desc: 'Automatically review new pull requests when opened' },
                    { key: 'autoFix' as const, label: 'Auto-Fix Issues', desc: 'Automatically create fix PRs for discovered issues' },
                ].map((item, i) => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i === 0 ? '1px solid var(--border-color)' : 'none' }}>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{item.label}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{item.desc}</p>
                        </div>
                        <button onClick={() => setSettings({ [item.key]: !settings[item.key] })} style={{ width: '48px', height: '26px', borderRadius: '13px', background: settings[item.key] ? 'var(--accent-primary)' : 'var(--bg-tertiary)', border: `1px solid ${settings[item.key] ? 'var(--accent-primary)' : 'var(--border-color)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.3s ease', padding: 0 }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: settings[item.key] ? '25px' : '2px', transition: 'left 0.3s ease' }} />
                        </button>
                    </div>
                ))}

                <div style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Scan Schedule</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['manual', 'daily', 'weekly'] as const).map(schedule => (
                            <button key={schedule} className={settings.scanSchedule === schedule ? 'btn-gradient' : 'btn-secondary'} style={{ textTransform: 'capitalize', fontSize: '13px' }} onClick={() => setSettings({ scanSchedule: schedule })}>{schedule}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Note */}
            <div className="glass-card animate-fade-in delay-400" style={{ padding: '20px', borderLeft: '3px solid var(--warning)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={16} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Security Note</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    API keys are stored locally in your browser&apos;s localStorage. They are never sent to third-party servers — only directly to the respective APIs (GitHub, Google Gemini, OpenAI, GitHub Copilot). For production use, consider implementing proper OAuth and server-side key storage.
                </p>
            </div>
        </form>
    );
}
