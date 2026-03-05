"use client";

import { useState, useRef, useEffect } from "react";
import { Send, TerminalSquare, Command, Loader2, Copy, Check, Bot, User } from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "../lib/store";
import { AI_PROVIDERS } from "../lib/ai-providers";

interface ChatMsg {
    id: string;
    role: "user" | "agent";
    content: string;
    provider?: string;
}

export default function ChatInterface() {
    const { settings, loaded } = useSettings();
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: '0', role: "agent", content: "I'm GitAgent — your AI-powered GitHub automation assistant. Ask me anything about your repos, code, or workflows!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const currentProvider = AI_PROVIDERS.find(p => p.id === settings.activeProvider) || AI_PROVIDERS[0];

    const getApiKey = () => {
        switch (settings.activeProvider) {
            case 'gemini': return settings.geminiApiKey;
            case 'openai': return settings.openaiApiKey;
            case 'copilot': return settings.copilotApiKey;
            default: return '';
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const apiKey = getApiKey();
        const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: input.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");

        if (!apiKey) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    role: "agent",
                    content: `⚠️ No API key configured for ${currentProvider.name}. Go to Settings to add your key.`,
                    provider: currentProvider.name,
                }]);
            }, 500);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: settings.activeProvider,
                    apiKey,
                    messages: messages.filter(m => m.id !== '0').concat(userMsg).map(m => ({
                        role: m.role === 'agent' ? 'assistant' : 'user',
                        content: m.content,
                    })),
                    model: currentProvider.defaultModel,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Chat failed');
            }

            const data = await res.json();
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: "agent",
                content: data.response,
                provider: currentProvider.name,
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: "agent",
                content: `Error: ${err instanceof Error ? err.message : 'Chat failed'}`,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const copyMsg = (msg: ChatMsg) => {
        navigator.clipboard.writeText(msg.content);
        setCopiedId(msg.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!loaded) return null;

    return (
        <section className="glass-card flex flex-col h-full">
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2 text-text-secondary">
                    <TerminalSquare className="w-4 h-4" /> Agent Terminal
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: `${currentProvider.color}20`, color: currentProvider.color, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {currentProvider.icon} {currentProvider.name}
                    </span>
                    <span className="badge badge-success text-xs hidden sm:flex">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                        Live
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-bg-primary/30">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div style={{ maxWidth: '85%', position: 'relative' }}>
                            <div className={`p-3 rounded-lg ${msg.role === "user"
                                ? "bg-accent-primary text-white rounded-tr-none shadow-glow"
                                : "bg-bg-tertiary border border-black/5 text-text-primary rounded-tl-none"
                                }`}>
                                {msg.role === "agent" && (
                                    <div className="text-xs mb-1 flex items-center gap-1 font-sans font-medium" style={{ color: currentProvider.color }}>
                                        <span style={{ color: 'var(--accent-primary)' }}>{">"}</span> GitAgent
                                        {msg.provider && <span style={{ fontSize: '10px', opacity: 0.7 }}> · {msg.provider}</span>}
                                    </div>
                                )}
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.role === "agent" && msg.id !== '0' && (
                                <button onClick={() => copyMsg(msg)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', opacity: 0.5 }}>
                                    {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-bg-tertiary border border-black/5 rounded-lg rounded-tl-none p-3 flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin-slow" style={{ color: currentProvider.color }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            <div className="p-4 border-t border-black/5">
                <form onSubmit={handleSend} className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        <Command className="w-4 h-4" />
                    </div>
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        className="input-field pl-10 pr-12 font-mono text-sm"
                        placeholder={`Ask ${currentProvider.name}...`}
                        disabled={loading} />
                    <button type="submit" disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md transition-colors"
                        style={{ color: currentProvider.color, opacity: input.trim() ? 1 : 0.3 }}>
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </section>
    );
}
