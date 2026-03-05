'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    GitFork,
    GitPullRequest,
    Search,
    Heart,
    Settings,
    Zap,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Code2,
    GitCommit,
    Award,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ai-playground', label: 'AI Playground', icon: Sparkles },
    { href: '/auto-agent', label: 'Auto Agent', icon: Zap },
    { href: '/code-generator', label: 'Code Generator', icon: Code2 },
    { href: '/commit-generator', label: 'Commit Gen', icon: GitCommit },
    { href: '/repositories', label: 'Repositories', icon: GitFork },
    { href: '/pr-review', label: 'PR Review', icon: GitPullRequest },
    { href: '/issue-scanner', label: 'Issue Scanner', icon: Search },
    { href: '/contributions', label: 'Contributions', icon: Heart },
    { href: '/badges', label: 'Badge Agent', icon: Award },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            style={{
                width: collapsed ? '72px' : 'var(--sidebar-width)',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                zIndex: 40,
                overflow: 'hidden',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: collapsed ? '20px 12px' : '20px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minHeight: 'var(--header-height)',
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <Zap size={20} color="white" />
                </div>
                {!collapsed && (
                    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                            GitAgent
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            AI Automation
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: collapsed ? '12px' : '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                background: isActive ? 'var(--accent-primary)' : 'transparent',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? 600 : 500,
                                transition: 'all 0.2s ease',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                position: 'relative',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <Icon size={20} style={{ flexShrink: 0 }} />
                            {!collapsed && <span>{item.label}</span>}
                            {isActive && !collapsed && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: '-12px',
                                        width: '3px',
                                        height: '24px',
                                        background: 'var(--accent-secondary)',
                                        borderRadius: '3px',
                                    }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Button */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    {!collapsed && 'Collapse'}
                </button>
            </div>
        </aside>
    );
}
