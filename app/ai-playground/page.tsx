'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Sparkles,
    Send,
    Copy,
    Check,
    RotateCcw,
    Zap,
    Bot,
    User,
    Loader2,
    ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../lib/store';
import { AI_PROVIDERS } from '../lib/ai-providers';
import type { AIProvider } from '../lib/ai-providers';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    provider?: string;
    model?: string;
    timestamp: string;
}

export default function AIPlaygroundPage() {
    const { settings, loaded } = useSettings();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeProvider, setActiveProvider] = useState<AIProvider>('gemini');
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (loaded && settings.activeProvider) {
            setActiveProvider(settings.activeProvider);
        }
    }, [loaded, settings.activeProvider]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const apiKey = getApiKey();
        if (!apiKey) {
            toast.error(`Please configure your ${currentProvider.name} API key in Settings`);
            return;
        }

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: activeProvider,
                    apiKey,
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    model: currentModel,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Chat failed');
            }

            const data = await res.json();

            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.response,
                provider: currentProvider.name,
                model: currentModel,
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Chat failed');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyMessage = (msg: Message) => {
        navigator.clipboard.writeText(msg.content);
        setCopiedId(msg.id);
        toast.success('Copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const clearChat = () => {
        setMessages([]);
        toast.success('Chat cleared');
    };

    if (!loaded) return null;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="gradient-text animate-gradient-x" style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
                    AI Playground
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Chat with multiple AI providers — compare, generate, and explore.
                </p>
            </header>

            {/* Provider Selector */}
            <div className="glass-card animate-fade-in delay-100" style={{ padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Provider:</span>
                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                        {AI_PROVIDERS.map(provider => {
                            const hasKey = (() => {
                                switch (provider.id) {
                                    case 'gemini': return !!settings.geminiApiKey;
                                    case 'openai': return !!settings.openaiApiKey;
                                    case 'copilot': return !!settings.copilotApiKey;
                                    default: return false;
                                }
                            })();
                            return (
                                <button
                                    key={provider.id}
                                    onClick={() => {
                                        setActiveProvider(provider.id);
                                        setSelectedModel('');
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 18px',
                                        borderRadius: 'var(--radius-md)',
                                        border: activeProvider === provider.id
                                            ? `2px solid ${provider.color}`
                                            : '1px solid var(--border-color)',
                                        background: activeProvider === provider.id
                                            ? `${provider.color}15`
                                            : 'var(--bg-tertiary)',
                                        color: activeProvider === provider.id ? provider.color : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        transition: 'all 0.2s ease',
                                        opacity: hasKey ? 1 : 0.4,
                                        position: 'relative',
                                    }}
                                >
                                    <span style={{ fontSize: '16px' }}>{provider.icon}</span>
                                    {provider.name}
                                    {!hasKey && (
                                        <span style={{
                                            fontSize: '10px',
                                            background: 'var(--error)',
                                            color: 'white',
                                            padding: '1px 6px',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                        }}>
                                            No Key
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Model Picker */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowModelPicker(!showModelPicker)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            <Zap size={12} />
                            {currentModel}
                            <ChevronDown size={12} />
                        </button>
                        {showModelPicker && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '6px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '6px',
                                zIndex: 20,
                                minWidth: '200px',
                                boxShadow: 'var(--shadow-lg)',
                            }}>
                                {currentProvider.models.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setSelectedModel(m);
                                            setShowModelPicker(false);
                                        }}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '8px 12px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: 'none',
                                            background: m === currentModel ? `${currentProvider.color}20` : 'transparent',
                                            color: m === currentModel ? currentProvider.color : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontFamily: 'var(--font-mono)',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="glass-card animate-fade-in delay-200" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '520px',
                overflow: 'hidden',
            }}>
                {/* Messages */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}>
                    {messages.length === 0 && (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '16px',
                            color: 'var(--text-muted)',
                        }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                background: `${currentProvider.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Sparkles size={32} style={{ color: currentProvider.color }} />
                            </div>
                            <p style={{ fontSize: '15px', fontWeight: 500 }}>Start a conversation with {currentProvider.name}</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '500px' }}>
                                {['Review my latest PR', 'Explain this error', 'Generate a REST API', 'Write unit tests'].map(q => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-tertiary)',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        }}>
                            <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: msg.role === 'user' ? 'var(--accent-gradient)' : `${currentProvider.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {msg.role === 'user'
                                    ? <User size={16} color="white" />
                                    : <Bot size={16} style={{ color: currentProvider.color }} />
                                }
                            </div>
                            <div style={{
                                maxWidth: '75%',
                                padding: '14px 18px',
                                borderRadius: 'var(--radius-md)',
                                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                fontSize: '14px',
                                lineHeight: '1.65',
                                position: 'relative',
                                border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                            }}>
                                {msg.role === 'assistant' && msg.provider && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: currentProvider.color,
                                        marginBottom: '6px',
                                        fontWeight: 600,
                                        fontFamily: 'var(--font-mono)',
                                    }}>
                                        {msg.provider} · {msg.model}
                                    </div>
                                )}
                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                                {msg.role === 'assistant' && (
                                    <button
                                        onClick={() => copyMessage(msg)}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            opacity: 0.6,
                                            transition: 'opacity 0.2s',
                                        }}
                                    >
                                        {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: `${currentProvider.color}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Loader2 size={16} style={{ color: currentProvider.color }} className="animate-spin-slow" />
                            </div>
                            <div style={{
                                padding: '14px 18px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                            }}>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentProvider.color, animation: 'bounce-subtle 1s ease-in-out infinite' }} />
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentProvider.color, animation: 'bounce-subtle 1s ease-in-out infinite 0.2s' }} />
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentProvider.color, animation: 'bounce-subtle 1s ease-in-out infinite 0.4s' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask ${currentProvider.name} anything...`}
                            rows={1}
                            style={{
                                flex: 1,
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '12px 16px',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'none',
                                outline: 'none',
                                minHeight: '44px',
                                maxHeight: '120px',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => e.target.style.borderColor = currentProvider.color}
                            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {messages.length > 0 && (
                                <button onClick={clearChat} className="btn-secondary" style={{ padding: '10px 12px' }}>
                                    <RotateCcw size={16} />
                                </button>
                            )}
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    background: currentProvider.gradient,
                                    color: 'white',
                                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: input.trim() && !loading ? 1 : 0.5,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
