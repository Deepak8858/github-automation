import Link from "next/link";
import { GitPullRequest, Bug, ScanSearch, Plus, Sparkles, Code2, GitCommit, Zap } from "lucide-react";

export default function QuickActions() {
    const actions = [
        {
            title: "Autonomous Agent",
            description: "AI agent that analyzes repos, creates issues, and submits PRs to fix them.",
            icon: <Zap className="w-6 h-6" style={{ color: '#F43F5E' }} />,
            color: "from-rose-500/20 to-transparent",
            borderColor: "border-rose-500/30",
            href: "/auto-agent",
        },
        {
            title: "AI Playground",
            description: "Chat with Gemini, OpenAI, or GitHub Copilot for code help.",
            icon: <Sparkles className="w-6 h-6" style={{ color: '#8B5CF6' }} />,
            color: "from-accent-primary/20 to-transparent",
            borderColor: "border-accent-primary/30",
            href: "/ai-playground",
        },
        {
            title: "Generate Code",
            description: "Generate production-ready code with AI in any language.",
            icon: <Code2 className="w-6 h-6" style={{ color: '#10A37F' }} />,
            color: "from-success/20 to-transparent",
            borderColor: "border-success/30",
            href: "/code-generator",
        },
        {
            title: "Commit Generator",
            description: "Create conventional commit messages from your diffs.",
            icon: <GitCommit className="w-6 h-6" style={{ color: '#F59E0B' }} />,
            color: "from-warning/20 to-transparent",
            borderColor: "border-warning/30",
            href: "/commit-generator",
        },
        {
            title: "Review PRs",
            description: "AI-powered pull request analysis for security and quality.",
            icon: <GitPullRequest className="w-6 h-6 text-accent-secondary" />,
            color: "from-accent-primary/20 to-transparent",
            borderColor: "border-accent-primary/30",
            href: "/pr-review",
        },
        {
            title: "Scan Issues",
            description: "Scan repositories for bugs, vulnerabilities, and code smells.",
            icon: <ScanSearch className="w-6 h-6 text-success" />,
            color: "from-success/20 to-transparent",
            borderColor: "border-success/30",
            href: "/issue-scanner",
        },
        {
            title: "Triage Issues",
            description: "Categorize and label open issues with AI assistance.",
            icon: <Bug className="w-6 h-6 text-warning" />,
            color: "from-warning/20 to-transparent",
            borderColor: "border-warning/30",
            href: "/repositories",
        },
    ];

    return (
        <section className="mb-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-text-secondary">
                <Plus className="w-4 h-4" /> Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className={`glass-card p-5 text-left flex flex-col group transition-all duration-300 hover:scale-[1.02] border hover:${action.borderColor} no-underline`}
                        style={{ textDecoration: 'none' }}
                    >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-linear-to-br ${action.color} border border-black/5`}>
                            {action.icon}
                        </div>
                        <h4 className="font-semibold text-text-primary mb-2 group-hover:text-accent-secondary transition-colors">
                            {action.title}
                        </h4>
                        <p className="text-sm text-text-muted leading-relaxed">
                            {action.description}
                        </p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
