"use client";

import { useState } from "react";
import { Send, TerminalSquare, Command } from "lucide-react";

export default function ChatInterface() {
    const [messages, setMessages] = useState([
        { role: "agent", content: "I'm connected to the `github-automation` repository. How can I help you automate today?" }
    ]);
    const [input, setInput] = useState("");

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages([...messages, { role: "user", content: input }]);
        setInput("");

        // Simulate thinking state
        setTimeout(() => {
            setMessages(prev => [...prev, { role: "agent", content: "I am analyzing your request to execute the necessary GitHub actions..." }]);
        }, 1000);
    };

    return (
        <section className="glass-card flex flex-col h-[400px]">
            <div className="p-4 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2 text-text-secondary">
                    <TerminalSquare className="w-4 h-4" /> Agent Terminal
                </h3>
                <span className="badge badge-success text-xs hidden sm:flex">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                    Online
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-bg-primary/30">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === "user"
                            ? "bg-accent-primary text-white rounded-tr-none shadow-glow"
                            : "bg-bg-tertiary border border-black/5 text-text-primary rounded-tl-none"
                            }`}>
                            {msg.role === "agent" && (
                                <div className="text-xs text-accent-secondary mb-1 flex items-center gap-1 font-sans font-medium">
                                    <span className="text-accent-primary">{">"}</span> GitAgent
                                </div>
                            )}
                            <p className="leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {messages[messages.length - 1].role === "user" && (
                    <div className="flex justify-start">
                        <div className="bg-bg-tertiary border border-black/5 rounded-lg rounded-tl-none p-4 w-12 flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-black/5">
                <form onSubmit={handleSend} className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                        <Command className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field pl-10 pr-12 font-mono text-sm"
                        placeholder="Instruct the agent... (e.g. 'Draft a release note')"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-accent-primary hover:bg-accent-primary/10 rounded-md transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </section>
    );
}
