'use client';

import { useState } from 'react';
import { GitCommit, Sparkles, Copy, Check, Loader2, ChevronDown, Tag, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../lib/store';
import { AI_PROVIDERS } from '../lib/ai-providers';
import type { AIProvider } from '../lib/ai-providers';

interface CommitResult {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    breaking: boolean;
    fullMessage: string;
}

const COMMIT_TYPES = [
    { type: 'feat', label: 'Feature', color: '#10A37F' },
    { type: 'fix', label: 'Bug Fix', color: '#EF4444' },
    { type: 'docs', label: 'Docs', color: '#3B82F6' },
    { type: 'refactor', label: 'Refactor', color: '#F59E0B' },
    { type: 'perf', label: 'Performance', color: '#8B5CF6' },
    { type: 'test', label: 'Tests', color: '#06B6D4' },
    { type: 'chore', label: 'Chore', color: '#64748B' },
];

export default function CommitGeneratorPage() {
    const { settings, loaded } = useSettings();
    const [diff, setDiff] = useState('');
    const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CommitResult | null>(null);
    const [copied, setCopied] = useState(false);

    const currentProvider = AI_PROVIDERS.find(p => p.id === activeProvider) || AI_PROVIDERS[0];
    const currentModel = selectedModel || currentProvider.defaultModel;

    const getApiKey = () => {
        switch (activeProvider) {
            case 'gemini': return settings.geminiApiKey;
            case 'openai': return settings.openaiApiKey;
            case 'copilot': return settings.copilotApiKey;
            default: return '';
        }
    };

    const handleGenerate = async () => {
        if (!diff.trim() || loading) return;
        const apiKey = getApiKey();
        if (!apiKey) { toast.error(`Configure ${currentProvider.name} API key in Settings`); return; }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/ai/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: activeProvider, apiKey, diff: diff.trim(), model: currentModel }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
            const data = await res.json();
            setResult(data);
            toast.success('Commit message generated!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed');
        } finally { setLoading(false); }
    };

    const copyMessage = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.fullMessage);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!loaded) return null;

    const typeInfo = result ? COMMIT_TYPES.find(c => c.type === result.type) : null;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="gradient-text animate-gradient-x" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Commit Generator</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Generate conventional commit messages from your diffs using AI.</p>
            </header>

            {/* Provider */}
            <div className="glass-card animate-fade-in delay-100" style={{ padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Provider:</span>
                    {AI_PROVIDERS.map(p => (
                        <button key={p.id} onClick={() => { setActiveProvider(p.id); setSelectedModel(''); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: activeProvider === p.id ? `2px solid ${p.color}` : '1px solid var(--border-color)', background: activeProvider === p.id ? `${p.color}15` : 'var(--bg-tertiary)', color: activeProvider === p.id ? p.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                            <span>{p.icon}</span>{p.name}
                        </button>
                    ))}
                    <div style={{ position: 'relative', marginLeft: 'auto' }}>
                        <button onClick={() => setShowModelPicker(!showModelPicker)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                            {currentModel}<ChevronDown size={12} />
                        </button>
                        {showModelPicker && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px', zIndex: 20, boxShadow: 'var(--shadow-lg)', minWidth: '180px' }}>
                                {currentProvider.models.map(m => (
                                    <button key={m} onClick={() => { setSelectedModel(m); setShowModelPicker(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: m === currentModel ? `${currentProvider.color}20` : 'transparent', color: m === currentModel ? currentProvider.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{m}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Diff Input */}
            <div className="glass-card animate-fade-in delay-200" style={{ padding: '20px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    <FileText size={16} style={{ color: currentProvider.color }} /> Paste your diff
                </label>
                <textarea value={diff} onChange={e => setDiff(e.target.value)} placeholder="Paste your git diff here... (git diff --staged)" rows={10}
                    style={{ width: '100%', background: '#0d0d12', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px 16px', color: '#f8fafc', fontSize: '13px', fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', lineHeight: '1.6' }} />
                <button className="btn-gradient" onClick={handleGenerate} disabled={!diff.trim() || loading} style={{ marginTop: '14px', width: '100%', justifyContent: 'center', opacity: !diff.trim() || loading ? 0.5 : 1 }}>
                    {loading ? <Loader2 size={16} className="animate-spin-slow" /> : <GitCommit size={16} />}
                    {loading ? 'Generating...' : 'Generate Commit Message'}
                </button>
            </div>

            {/* Result */}
            {result && (
                <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Sparkles size={18} style={{ color: currentProvider.color }} />
                            <span style={{ fontWeight: 600, fontSize: '16px' }}>Generated Message</span>
                        </div>
                        <button onClick={copyMessage} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Type Badge */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: typeInfo ? `${typeInfo.color}20` : 'var(--bg-tertiary)', color: typeInfo?.color || 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, border: `1px solid ${typeInfo?.color || 'var(--border-color)'}40` }}>
                            <Tag size={12} />{result.type}
                        </span>
                        {result.scope && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({result.scope})</span>}
                        {result.breaking && <span style={{ padding: '4px 10px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(239,68,68,0.3)' }}>BREAKING</span>}
                    </div>

                    {/* Full Message */}
                    <div className="code-block" style={{ marginBottom: '16px' }}>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.fullMessage}</pre>
                    </div>

                    {result.body && (
                        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Extended Description</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{result.body}</p>
                        </div>
                    )}

                    {/* Quick Reference */}
                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>Commit Types:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {COMMIT_TYPES.map(ct => (
                                <span key={ct.type} style={{ padding: '3px 10px', borderRadius: '10px', background: `${ct.color}15`, color: ct.color, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{ct.type}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
