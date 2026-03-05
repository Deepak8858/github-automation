'use client';

import { useState, useEffect, useRef } from 'react';
import { Award, Loader2, Send, Trophy, Lock, Sparkles, RefreshCw, ChevronDown, Bot, Rocket, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Settings {
    githubToken: string;
    geminiApiKey: string;
    openaiApiKey: string;
    copilotApiKey: string;
    activeProvider: 'gemini' | 'openai' | 'copilot';
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    earned: boolean;
    progress: number;
    current: number;
    target: number;
    category: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const tierColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    bronze: { bg: 'rgba(205, 127, 50, 0.1)', border: 'rgba(205, 127, 50, 0.4)', text: '#CD7F32', glow: '0 0 20px rgba(205, 127, 50, 0.2)' },
    silver: { bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.4)', text: '#C0C0C0', glow: '0 0 20px rgba(192, 192, 192, 0.2)' },
    gold: { bg: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255, 215, 0, 0.4)', text: '#FFD700', glow: '0 0 20px rgba(255, 215, 0, 0.2)' },
    platinum: { bg: 'rgba(0, 242, 254, 0.1)', border: 'rgba(0, 242, 254, 0.4)', text: '#00f2fe', glow: '0 0 20px rgba(0, 242, 254, 0.2)' },
};

export default function BadgesPage() {
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        githubToken: '', geminiApiKey: '', openaiApiKey: '', copilotApiKey: '', activeProvider: 'gemini',
    });
    const [loading, setLoading] = useState(false);
    const [badgeData, setBadgeData] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'earned' | 'unearned'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [earningBadge, setEarningBadge] = useState<string | null>(null);
    const [earnedResults, setEarnedResults] = useState<Record<string, string[]>>({});
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const savedSettings = localStorage.getItem('gh-agent-settings');
        if (savedSettings) {
            try { setSettings(JSON.parse(savedSettings)); } catch { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const fetchBadges = async () => {
        if (!settings.githubToken) {
            toast.error('Please add your GitHub token in Settings first');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/github/badges', {
                headers: { 'x-github-token': settings.githubToken },
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch badges');
            const data = await res.json();
            setBadgeData(data);
            toast.success(`Found ${data.summary.earned}/${data.summary.total} badges earned!`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch badges');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mounted && settings.githubToken) {
            fetchBadges();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, settings.githubToken]);

    const sendChat = async () => {
        if (!chatInput.trim()) return;
        const activeKey = settings.activeProvider === 'openai' ? settings.openaiApiKey :
            settings.activeProvider === 'copilot' ? settings.copilotApiKey : settings.geminiApiKey;

        if (!activeKey) {
            toast.error(`Please add your ${settings.activeProvider} API key in Settings`);
            return;
        }

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await fetch('/api/ai/badges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: settings.activeProvider,
                    apiKey: activeKey,
                    message: chatInput,
                    badgeData,
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'AI request failed');
            const data = await res.json();
            setChatMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
            }]);
        } catch (err: any) {
            toast.error(err.message || 'AI chat failed');
        } finally {
            setChatLoading(false);
        }
    };

    const autoEarnBadge = async (badge: Badge) => {
        if (badge.earned) return;

        const activeKey = settings.activeProvider === 'openai' ? settings.openaiApiKey :
            settings.activeProvider === 'copilot' ? settings.copilotApiKey : settings.geminiApiKey;

        setEarningBadge(badge.id);

        try {
            const res = await fetch('/api/ai/auto-badge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    githubToken: settings.githubToken,
                    action: 'auto_earn',
                    badgeId: badge.id,
                    provider: settings.activeProvider,
                    apiKey: activeKey,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setEarnedResults(prev => ({ ...prev, [badge.id]: data.results }));
                toast.success(`🚀 Autonomous action completed for "${badge.name}"!`);
                // Refresh badges after a delay
                setTimeout(() => fetchBadges(), 3000);
            } else {
                const err = await res.json();
                toast.error(err.error || 'Auto-earn failed');
            }
        } catch (err: any) {
            toast.error(err.message || 'Auto-earn failed');
        }
        setEarningBadge(null);
    };

    const badges: Badge[] = badgeData?.badges || [];
    const categories = ['All', ...Array.from(new Set(badges.map(b => b.category)))];
    const filteredBadges = badges
        .filter(b => filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned)
        .filter(b => categoryFilter === 'All' ? true : b.category === categoryFilter);

    if (!mounted) return null;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Card */}
            <div style={{ padding: '32px', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF6347, #FF69B4, #8B5CF6)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 99, 71, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Award size={26} style={{ color: '#FFD700' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>GitHub Badges Agent</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>
                            Discover your achievements &amp; let AI autonomously earn more badges for you
                        </p>
                    </div>
                    <button
                        onClick={fetchBadges}
                        disabled={loading}
                        className="btn-gradient"
                        style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        {loading ? 'Scanning...' : 'Refresh Badges'}
                    </button>
                </div>

                {/* Stats Summary */}
                {badgeData && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
                        {[
                            { label: 'Earned', value: badgeData.summary.earned, color: '#22c55e' },
                            { label: 'Remaining', value: badgeData.summary.unearned, color: '#f59e0b' },
                            { label: 'Total Stars', value: badgeData.stats.totalStars, color: '#FFD700' },
                            { label: 'Total PRs', value: badgeData.stats.prCount, color: '#8B5CF6' },
                        ].map(stat => (
                            <div key={stat.label} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color, fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
                {/* Badge Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Status filter */}
                        <div className="tab-nav" style={{ background: 'var(--bg-card)' }}>
                            {(['all', 'earned', 'unearned'] as const).map(f => (
                                <button key={f} className={`tab-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                    {f === 'all' ? '🏅 All' : f === 'earned' ? '✅ Earned' : '🔒 Locked'}
                                </button>
                            ))}
                        </div>

                        {/* Category dropdown */}
                        {badges.length > 0 && (
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    style={{
                                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                        borderRadius: '8px', padding: '8px 32px 8px 12px', color: 'var(--text-primary)',
                                        fontSize: '14px', cursor: 'pointer', outline: 'none',
                                        appearance: 'none', WebkitAppearance: 'none',
                                    }}
                                >
                                    {categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                            </div>
                        )}
                    </div>

                    {/* Badge Cards */}
                    {loading ? (
                        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px', display: 'block' }} />
                            <p>Scanning your GitHub achievements...</p>
                        </div>
                    ) : filteredBadges.length === 0 && badges.length > 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Lock size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.5 }} />
                            <p>No badges match this filter</p>
                        </div>
                    ) : badges.length === 0 ? (
                        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                            <Trophy size={40} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No badges loaded yet</p>
                            <p style={{ fontSize: '13px' }}>Add your GitHub token in Settings and click &quot;Refresh Badges&quot;</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                            {filteredBadges.map(badge => {
                                const tc = tierColors[badge.tier];
                                const isEarning = earningBadge === badge.id;
                                const result = earnedResults[badge.id];
                                return (
                                    <div
                                        key={badge.id}
                                        style={{
                                            padding: '20px', borderRadius: '14px',
                                            background: badge.earned ? tc.bg : 'var(--bg-card)',
                                            border: `1px solid ${badge.earned ? tc.border : 'var(--border-color)'}`,
                                            opacity: badge.earned ? 1 : 0.7,
                                            transition: 'all 0.3s ease',
                                            cursor: 'default',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = badge.earned ? tc.glow : 'var(--shadow-md)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        {/* Tier indicator */}
                                        <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: tc.text, fontWeight: 700 }}>
                                            {badge.tier}
                                        </div>

                                        <div style={{ fontSize: '36px', marginBottom: '12px', filter: badge.earned ? 'none' : 'grayscale(1)' }}>
                                            {badge.icon}
                                        </div>

                                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: badge.earned ? tc.text : 'var(--text-primary)' }}>
                                            {badge.name}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                                            {badge.description}
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                                            <div style={{
                                                width: `${Math.min(100, badge.progress)}%`,
                                                height: '100%',
                                                borderRadius: '6px',
                                                background: badge.earned
                                                    ? `linear-gradient(90deg, ${tc.text}, ${tc.border})`
                                                    : 'var(--text-muted)',
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span>{badge.current} / {badge.target}</span>
                                            <span>{badge.earned ? '✅' : `${Math.round(badge.progress)}%`}</span>
                                        </div>

                                        {/* Auto-Earn Button */}
                                        {!badge.earned && (
                                            <>
                                                {result ? (
                                                    <div style={{ fontSize: '11px', color: '#22c55e', lineHeight: '1.6' }}>
                                                        {result.map((r, i) => (
                                                            <div key={i}>{r}</div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => autoEarnBadge(badge)}
                                                        disabled={isEarning || !!earningBadge}
                                                        style={{
                                                            width: '100%', padding: '7px 12px', borderRadius: '8px',
                                                            background: isEarning ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(139, 92, 246, 0.15))',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            color: isEarning ? 'var(--text-muted)' : '#FFD700',
                                                            fontSize: '11px', fontWeight: 600,
                                                            cursor: isEarning ? 'wait' : 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        {isEarning ? (
                                                            <><Loader2 size={12} className="animate-spin" /> Working...</>
                                                        ) : (
                                                            <><Zap size={12} /> Auto-Earn</>
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* AI Agent Chat Panel */}
                <div style={{
                    borderRadius: '16px', background: '#09090b', border: '1px solid var(--border-color)',
                    display: 'flex', flexDirection: 'column', height: '600px', position: 'sticky', top: '100px',
                }}>
                    {/* Chat header */}
                    <div style={{
                        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(139, 92, 246, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={16} style={{ color: '#FFD700' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>Badges AI Agent</div>
                            <div style={{ fontSize: '11px', color: '#52525b' }}>Ask me how to earn more badges!</div>
                        </div>
                        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)' }} />
                    </div>

                    {/* Chat messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chatMessages.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#52525b' }}>
                                <Sparkles size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                                <p style={{ fontSize: '13px', marginBottom: '16px' }}>Ask me about any badge or achievement!</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        'How do I earn more stars?',
                                        'What badges am I closest to?',
                                        'Auto-earn all my easy badges',
                                    ].map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => { setChatInput(suggestion); }}
                                            style={{
                                                padding: '10px 14px', borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                                color: '#a1a1aa', fontSize: '12px', cursor: 'pointer',
                                                textAlign: 'left', transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e4e4e7'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a1a1aa'; }}
                                        >
                                            💬 {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {chatMessages.map(msg => (
                            <div
                                key={msg.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    animation: 'fadeIn 0.3s ease',
                                }}
                            >
                                <div style={{
                                    maxWidth: '85%', padding: '12px 16px', borderRadius: '12px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))'
                                        : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${msg.role === 'user' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    fontSize: '13px', lineHeight: '1.6',
                                    color: '#e4e4e7', whiteSpace: 'pre-wrap',
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {chatLoading && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#52525b', fontSize: '13px' }}>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Thinking...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat input */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Ask about badges..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                                disabled={chatLoading}
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                    padding: '10px 14px', color: '#f8fafc', fontSize: '13px',
                                    outline: 'none', transition: 'border 0.2s',
                                }}
                            />
                            <button
                                onClick={sendChat}
                                disabled={chatLoading || !chatInput.trim()}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '8px',
                                    background: chatInput.trim() ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255,255,255,0.05)',
                                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: chatInput.trim() ? 'pointer' : 'default',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Send size={16} style={{ color: chatInput.trim() ? '#000' : '#52525b' }} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
