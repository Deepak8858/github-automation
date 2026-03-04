import { Bot, CheckCircle, Clock, Loader2, Play } from "lucide-react";

export type AgentState = "idle" | "working" | "pending_approval" | "sleeping";

interface AgentStatusProps {
    state: AgentState;
    currentTask?: string;
}

export default function AgentStatus({ state, currentTask }: AgentStatusProps) {
    return (
        <div className="glass-card p-6 flex items-center justify-between mb-8 animate-float-card">
            <div className="flex items-center gap-4">
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full ${state === "working" ? "bg-accent-primary/20 animate-pulse-glow" :
                    state === "pending_approval" ? "bg-warning/20" :
                        "bg-tertiary"
                    }`}>
                    {state === "working" && (
                        <div className="absolute inset-0 rounded-full border-2 border-accent-primary border-t-transparent animate-spin-slow opacity-50"></div>
                    )}
                    <Bot className={`h-7 w-7 animate-bounce-subtle ${state === "working" ? "text-accent-secondary" :
                        state === "pending_approval" ? "text-warning" :
                            "text-text-muted"
                        }`} />
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-1">
                        {state === "idle" && "Agent is standing by"}
                        {state === "working" && "Agent is working"}
                        {state === "pending_approval" && "Waiting for approval"}
                        {state === "sleeping" && "Agent is sleeping"}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        {currentTask || (state === "working" ? "Processing..." : "Ready for your next command.")}
                    </p>
                </div>
            </div>

            <div>
                {state === "pending_approval" && (
                    <div className="flex gap-3">
                        <button className="btn-secondary text-error hover:text-error hover:border-error/50 hover:bg-error/10">Reject</button>
                        <button className="btn-gradient">Approve & Continue</button>
                    </div>
                )}
                {state === "idle" && (
                    <button className="btn-secondary">
                        <Play className="w-4 h-4" /> Start Auto-Triage
                    </button>
                )}
            </div>
        </div>
    );
}
