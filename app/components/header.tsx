'use client';

import { Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Dashboard', subtitle: 'Overview of your GitHub automation' },
    '/ai-playground': { title: 'AI Playground', subtitle: 'Chat with multiple AI providers' },
    '/code-generator': { title: 'Code Generator', subtitle: 'Generate code with AI assistance' },
    '/commit-generator': { title: 'Commit Generator', subtitle: 'AI-powered conventional commits' },
    '/repositories': { title: 'Repositories', subtitle: 'Manage your connected repositories' },
    '/pr-review': { title: 'PR Review', subtitle: 'AI-powered pull request analysis' },
    '/issue-scanner': { title: 'Issue Scanner', subtitle: 'Scan repos for bugs & improvements' },
    '/contributions': { title: 'Contributions', subtitle: 'Discover & auto-contribute to repos' },
    '/settings': { title: 'Settings', subtitle: 'Configure API keys & preferences' },
};

export default function Header() {
    const pathname = usePathname();
    const page = pageTitles[pathname] || { title: 'GitAgent', subtitle: '' };

    return (
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 'var(--sidebar-width)',
                right: 0,
                height: 'var(--header-height)',
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                zIndex: 30,
                transition: 'left 0.3s ease',
            }}
        >
            <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {page.title}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 400 }}>
                    {page.subtitle}
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Repo Selector */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 16px',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-glow)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                    <span>org/github-automation</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted ml-1"><path d="m6 9 6 6 6-6" /></svg>
                </div>

                {/* Search Bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 16px',
                        minWidth: '240px',
                    }}
                >
                    <Search size={16} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search repos, PRs, issues..."
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                            width: '100%',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>

                <ThemeToggle />

                {/* Notification Bell */}
                <button
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-glow)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                >
                    <Bell size={18} />
                    <div
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                        }}
                    />
                </button>

                {/* Avatar */}
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'white',
                        cursor: 'pointer',
                    }}
                >
                    U
                </div>
            </div>
        </header>
    );
}
