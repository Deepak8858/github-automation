'use client';

import { useState } from 'react';
import { Code2, Copy, Check, Download, Sparkles, ChevronDown, FileCode, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../lib/store';
import { AI_PROVIDERS } from '../lib/ai-providers';
import type { AIProvider } from '../lib/ai-providers';

interface GeneratedResult {
    code: string;
    language: string;
    explanation: string;
    dependencies: string[];
    filename: string;
}

const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'C#', 'Ruby', 'PHP'];

const TEMPLATES = [
    { label: 'REST API', prompt: 'Create a REST API endpoint with CRUD operations for users with error handling' },
    { label: 'Auth Middleware', prompt: 'Create JWT authentication middleware with token validation' },
    { label: 'DB Model', prompt: 'Create a database model for an e-commerce product catalog' },
    { label: 'WebSocket', prompt: 'Create a WebSocket server for real-time chat with rooms' },
    { label: 'Unit Tests', prompt: 'Write unit tests for a user authentication service' },
    { label: 'CI/CD', prompt: 'Create a GitHub Actions CI/CD pipeline for Node.js' },
];

export default function CodeGeneratorPage() {
    const { settings, loaded } = useSettings();
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('TypeScript');
    const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GeneratedResult | null>(null);
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
        if (!prompt.trim() || loading) return;
        const apiKey = getApiKey();
        if (!apiKey) { toast.error(`Configure ${currentProvider.name} API key in Settings`); return; }
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: activeProvider, apiKey, prompt: prompt.trim(), language, model: currentModel }),
            });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Generation failed'); }
            const data = await res.json();
            setResult(data);
            toast.success('Code generated!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Generation failed');
        } finally { setLoading(false); }
    };

    const copyCode = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.code);
        setCopied(true);
        toast.success('Copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadCode = () => {
        if (!result) return;
        const blob = new Blob([result.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = result.filename || 'code.txt'; a.click();
        URL.revokeObjectURL(url);
    };

    if (!loaded) return null;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="gradient-text animate-gradient-x" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Code Generator</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Generate production-ready code with AI.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Provider */}
                    <div className="glass-card animate-fade-in delay-100" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            {AI_PROVIDERS.map(p => (
                                <button key={p.id} onClick={() => { setActiveProvider(p.id); setSelectedModel(''); }}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: 'var(--radius-sm)', border: activeProvider === p.id ? `2px solid ${p.color}` : '1px solid var(--border-color)', background: activeProvider === p.id ? `${p.color}15` : 'var(--bg-tertiary)', color: activeProvider === p.id ? p.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                                    <span>{p.icon}</span>{p.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowModelPicker(!showModelPicker)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                                Model: {currentModel}<ChevronDown size={12} />
                            </button>
                            {showModelPicker && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px', zIndex: 20, boxShadow: 'var(--shadow-lg)' }}>
                                    {currentProvider.models.map(m => (
                                        <button key={m} onClick={() => { setSelectedModel(m); setShowModelPicker(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: 'none', background: m === currentModel ? `${currentProvider.color}20` : 'transparent', color: m === currentModel ? currentProvider.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{m}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="glass-card animate-fade-in delay-200" style={{ padding: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Language</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {LANGUAGES.map(lang => (
                                <button key={lang} onClick={() => setLanguage(lang)} style={{ padding: '6px 14px', borderRadius: '16px', border: language === lang ? `1px solid ${currentProvider.color}` : '1px solid var(--border-color)', background: language === lang ? `${currentProvider.color}15` : 'transparent', color: language === lang ? currentProvider.color : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 500, transition: 'all 0.2s' }}>{lang}</button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="glass-card animate-fade-in delay-300" style={{ padding: '16px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Describe what to generate</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Create a REST API with auth..." rows={4} style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: '1.6' }} />
                        <div style={{ marginTop: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Templates:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {TEMPLATES.map(t => (
                                    <button key={t.label} onClick={() => setPrompt(t.prompt)} style={{ padding: '5px 12px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}>{t.label}</button>
                                ))}
                            </div>
                        </div>
                        <button className="btn-gradient" onClick={handleGenerate} disabled={!prompt.trim() || loading} style={{ marginTop: '16px', width: '100%', justifyContent: 'center', opacity: !prompt.trim() || loading ? 0.5 : 1 }}>
                            {loading ? <Loader2 size={16} className="animate-spin-slow" /> : <Sparkles size={16} />}
                            {loading ? 'Generating...' : 'Generate Code'}
                        </button>
                    </div>
                </div>

                {/* Right Column - Output */}
                <div className="glass-card animate-fade-in delay-200" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '500px' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Code2 size={16} style={{ color: currentProvider.color }} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{result ? result.filename : 'Output'}</span>
                            {result && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: `${currentProvider.color}20`, color: currentProvider.color, fontFamily: 'var(--font-mono)' }}>{result.language}</span>}
                        </div>
                        {result && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={copyCode} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}</button>
                                <button onClick={downloadCode} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}><Download size={12} />Save</button>
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-muted)' }}>
                                <Loader2 size={32} className="animate-spin-slow" style={{ color: currentProvider.color }} />
                                <p style={{ fontSize: '13px' }}>Generating with {currentProvider.name}...</p>
                            </div>
                        ) : result ? (
                            <>
                                <div className="code-block" style={{ marginBottom: '16px', maxHeight: '300px', overflow: 'auto' }}><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.code}</pre></div>
                                <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Explanation</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>{result.explanation}</p>
                                </div>
                                {result.dependencies?.length > 0 && (
                                    <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={12} /> Dependencies</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {result.dependencies.map(d => <span key={d} style={{ padding: '3px 10px', borderRadius: '10px', background: `${currentProvider.color}15`, color: currentProvider.color, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{d}</span>)}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
                                <FileCode size={48} style={{ opacity: 0.3 }} />
                                <p style={{ fontSize: '14px' }}>Generated code appears here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
