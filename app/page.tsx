import AgentStatus from "./components/agent-status";
import QuickActions from "./components/quick-actions";
import ActivityFeed from "./components/activity-feed";
import ChatInterface from "./components/chat-interface";

export default function Home() {
  return (
    <div className="animate-fade-in w-full max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold gradient-text animate-gradient-x mb-2 tracking-tight">Agent Dashboard</h1>
        <p className="text-text-muted">Monitor and control your GitHub automation agent.</p>
      </header>

      <div className="animate-fade-in delay-100">
        <AgentStatus state="idle" />
      </div>

      <div className="animate-fade-in delay-200 mt-6">
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in delay-300 mt-6">
        <div className="h-[450px]">
          <ActivityFeed />
        </div>
        <div className="h-[450px]">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
