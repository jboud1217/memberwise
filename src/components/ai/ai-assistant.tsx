"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  X,
  Send,
  Globe,
  Mail,
  BarChart3,
  CalendarDays,
  Users,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { aiChat } from "@/actions/ai";
import type { AIMessage, AICapability } from "@/lib/ai";

const QUICK_ACTIONS: {
  label: string;
  capability: AICapability;
  icon: typeof Sparkles;
  prompt: string;
  color: string;
}[] = [
  {
    label: "Website Ideas",
    capability: "website-edit",
    icon: Globe,
    prompt: "Suggest improvements for our membership website — better copy, layout ideas, and calls-to-action to convert visitors into members.",
    color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    label: "Draft Email",
    capability: "email-draft",
    icon: Mail,
    prompt: "Help me draft a member newsletter for this month. Include a warm greeting, any upcoming events, and a call to action.",
    color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
  {
    label: "Get Insights",
    capability: "analytics",
    icon: BarChart3,
    prompt: "Analyze our membership data and give me actionable insights about retention, growth opportunities, and revenue trends.",
    color: "bg-green-50 text-green-700 hover:bg-green-100",
  },
  {
    label: "Plan Event",
    capability: "event-planning",
    icon: CalendarDays,
    prompt: "Help me plan our next member event. Suggest event types, format options, pricing strategies, and promotion ideas based on our membership.",
    color: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    label: "Boost Engagement",
    capability: "engagement",
    icon: Users,
    prompt: "Create a 30-day engagement plan to reduce lapsed members and improve overall member satisfaction.",
    color: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCapability, setActiveCapability] = useState<AICapability | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function handleSend(content?: string, capability?: AICapability) {
    const text = content || input.trim();
    if (!text) return;

    const userMessage: AIMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    if (capability) setActiveCapability(capability);

    try {
      const { response } = await aiChat(newMessages, capability || activeCapability);
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please make sure the ANTHROPIC_API_KEY is configured and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([]);
    setActiveCapability(undefined);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200 transition-transform hover:scale-105 active:scale-95"
          title="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold">Memberwise AI</span>
              {activeCapability && (
                <Badge className="bg-white/20 text-white text-[10px]">
                  {activeCapability}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                  title="New chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 text-violet-400" />
                  <h3 className="font-semibold">How can I help?</h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    I can help with your website, emails, analytics, events, and member engagement.
                  </p>
                </div>

                {/* Quick action chips */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--muted-foreground)]">Quick Actions</div>
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.capability}
                        onClick={() => handleSend(action.prompt, action.capability)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${action.color}`}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-[var(--muted)] text-[var(--foreground)]"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(msg.content),
                          }}
                        />
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-[var(--muted)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border)] p-3">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your organization..."
                className="text-sm"
                disabled={loading}
              />
              <Button
                size="sm"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 bg-violet-600 hover:bg-violet-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simple markdown to HTML (bold, italic, lists, headers)
function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h4 class='font-semibold mt-3 mb-1'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 class='font-semibold mt-3 mb-1'>$1</h3>")
    .replace(/^# (.+)$/gm, "<h3 class='font-bold mt-3 mb-1'>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$2</li>")
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
