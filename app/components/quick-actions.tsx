import { GitPullRequest, Bug, ScanSearch, Plus } from "lucide-react";

export default function QuickActions() {
    const actions = [
        {
            title: "Review Open PRs",
            description: "Analyze 3 pending pull requests for security and style.",
            icon: <GitPullRequest className="w-6 h-6 text-accent-secondary" />,
            color: "from-accent-primary/20 to-transparent",
            borderColor: "border-accent-primary/30"
        },
        {
            title: "Triage Issues",
            description: "Categorize and label 12 unassigned user issues.",
            icon: <Bug className="w-6 h-6 text-warning" />,
            color: "from-warning/20 to-transparent",
            borderColor: "border-warning/30"
        },
        {
            title: "Scan Repository",
            description: "Check for dependency vulnerabilities and stale branches.",
            icon: <ScanSearch className="w-6 h-6 text-success" />,
            color: "from-success/20 to-transparent",
            borderColor: "border-success/30"
        }
    ];

    return (
        <section className="mb-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-text-secondary">
                <Plus className="w-4 h-4" /> Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        className={`glass-card p-5 text-left flex flex-col group transition-all duration-300 hover:scale-[1.02] border hover:${action.borderColor} hover:animate-float-card`}
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
                    </button>
                ))}
            </div>
        </section>
    );
}
