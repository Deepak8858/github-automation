import { Activity, GitCommit, MessageSquare, AlertCircle } from "lucide-react";

export default function ActivityFeed() {
    const activities = [
        {
            type: "commit",
            icon: <GitCommit className="w-4 h-4 text-success" />,
            message: "Merged PR #142: Fix memory leak in auth provider",
            time: "2 mins ago",
        },
        {
            type: "comment",
            icon: <MessageSquare className="w-4 h-4 text-info" />,
            message: "Responded to issue #145: 'Requires reproduction steps'",
            time: "15 mins ago",
        },
        {
            type: "alert",
            icon: <AlertCircle className="w-4 h-4 text-error" />,
            message: "Found potential vulnerability in updated dependabot PR",
            time: "1 hour ago",
        },
        {
            type: "commit",
            icon: <GitCommit className="w-4 h-4 text-success" />,
            message: "Auto-fixed lint errors in main branch",
            time: "2 hours ago",
        }
    ];

    return (
        <section className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-lg font-medium mb-6 flex items-center gap-2 text-text-secondary pb-4 border-b border-black/5">
                <Activity className="w-5 h-5" /> Recent Activity
            </h3>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                    {activities.map((activity, i) => (
                        <div key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center border border-black/5 group-hover:border-accent-primary/50 transition-colors z-10">
                                    {activity.icon}
                                </div>
                                {i !== activities.length - 1 && (
                                    <div className="w-px h-full bg-black/5 mt-2 group-hover:bg-accent-primary/20 transition-colors"></div>
                                )}
                            </div>
                            <div className="pb-4">
                                <p className="text-sm font-medium text-text-primary group-hover:text-accent-secondary transition-colors">
                                    {activity.message}
                                </p>
                                <p className="text-xs text-text-muted mt-1">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn-ghost w-full justify-center mt-4 text-xs border border-transparent hover:border-black/5">
                View Full Logs
            </button>
        </section>
    );
}
