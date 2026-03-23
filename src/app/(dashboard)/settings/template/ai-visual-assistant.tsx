"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Send, X, Loader2, Undo2, Wand2, Type, Palette, LayoutGrid, Plus, RotateCcw, ChevronUp, MessageSquare } from "lucide-react";
import { aiVisualEdit, type AIEditResult, type AIEditOperation } from "@/actions/ai";
import type { PageDocument, SectionDocument, SectionType } from "@/lib/types/site-document";

// ─── Types ──────────────────────────────────────────

interface AIVisualAssistantProps {
  pages: PageDocument[];
  currentPageSlug: string;
  onApplyOperations: (ops: AIEditOperation[], pageSlug: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  focusSectionId?: string | null;
  onClearFocus?: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  operations?: AIEditOperation[];
  timestamp: number;
}

// ─── Quick Actions ──────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Improve copy", icon: Type, prompt: "Improve the copywriting across all sections. Make it more compelling and professional." },
  { label: "Add section", icon: Plus, prompt: "Suggest and add a new section that would improve this page. Choose the most impactful section type." },
  { label: "Modern style", icon: Palette, prompt: "Make the page look more modern — update styles with gradients, better spacing, and subtle animations." },
  { label: "Rewrite for org", icon: Wand2, prompt: "Rewrite all content to be specific to our organization. Replace any generic placeholder text with compelling, tailored copy." },
  { label: "Better layout", icon: LayoutGrid, prompt: "Improve the page layout and structure. Reorder sections for better flow and add any missing important sections." },
];

const SECTION_QUICK_ACTIONS = [
  { label: "Improve content", prompt: "Improve this section's content — make the copy more compelling and professional." },
  { label: "More visual", prompt: "Make this section more visually appealing — add styling like gradients, better colors, animations." },
  { label: "Expand", prompt: "Expand this section with more detail and content while keeping it professional." },
  { label: "Simplify", prompt: "Simplify this section — make it cleaner and more focused with less text." },
];

// ─── Main Component ─────────────────────────────────

export function AIVisualAssistant({
  pages,
  currentPageSlug,
  onApplyOperations,
  onUndo,
  canUndo,
  focusSectionId,
  onClearFocus,
}: AIVisualAssistantProps) {
  const [expanded, setExpanded] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-expand and focus when a section AI request comes in
  useEffect(() => {
    if (focusSectionId) {
      setExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [focusSectionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, expanded]);

  // Focus input when expanding
  useEffect(() => {
    if (expanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [expanded]);

  const currentPage = pages.find((p) => p.slug === currentPageSlug);
  const focusSection = focusSectionId
    ? currentPage?.sections.find((s) => s.id === focusSectionId)
    : null;

  function handleSend(text?: string) {
    const input = text || prompt.trim();
    if (!input || !currentPage) return;

    const userMsg: ChatMessage = { role: "user", content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    if (!expanded) setExpanded(true);

    startTransition(async () => {
      try {
        const sections = currentPage.sections.map((s) => ({
          id: s.id,
          type: s.type,
          props: s.props,
          style: s.style,
        }));

        const res = await aiVisualEdit(sections, input, focusSectionId || undefined);

        if ("error" in res) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: res.error, timestamp: Date.now() },
          ]);
          return;
        }

        const { result } = res;
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: result.message,
          operations: result.operations,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (result.operations.length > 0) {
          onApplyOperations(result.operations, currentPageSlug);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Please try again.", timestamp: Date.now() },
        ]);
      }
    });
  }

  const quickActions = focusSectionId ? SECTION_QUICK_ACTIONS : QUICK_ACTIONS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60]">
      {/* Expanded chat panel */}
      {expanded && (
        <div className="mx-auto mb-0 w-full max-w-2xl overflow-hidden rounded-t-2xl border border-b-0 border-[var(--border)] bg-[var(--card)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-white" />
              <span className="text-xs font-semibold text-white">AI Assistant</span>
              {focusSection && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                  {focusSection.type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {canUndo && (
                <button
                  onClick={onUndo}
                  className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  title="Undo last AI change"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              )}
              {focusSectionId && (
                <button
                  onClick={onClearFocus}
                  className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  title="Switch to full page"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="rounded p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="max-h-[280px] overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="space-y-2.5">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {focusSectionId
                    ? `What would you like to change about this ${focusSection?.type || "section"}?`
                    : "Tell me what to change. I can update content, add sections, restyle, and more."}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.prompt)}
                      disabled={pending}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-[10px] font-medium text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-50"
                    >
                      {"icon" in action && (() => { const Icon = (action as { icon: React.ComponentType<{ className?: string }> }).icon; return <Icon className="h-2.5 w-2.5" />; })()}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.timestamp} className={cn("mb-2.5", msg.role === "user" ? "text-right" : "text-left")}>
                <div
                  className={cn(
                    "inline-block max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--muted)] text-[var(--foreground)]"
                  )}
                >
                  {msg.content}
                  {msg.operations && msg.operations.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 pt-1.5 border-t border-current/10">
                      {msg.operations.map((op, j) => (
                        <span key={j} className={cn(
                          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                          op.op === "add" ? "bg-green-500/20 text-green-700" : op.op === "remove" ? "bg-red-500/20 text-red-700" : "bg-blue-500/20 text-blue-700"
                        )}>
                          {op.op === "add" && `+ ${op.section?.type}`}
                          {op.op === "update" && `Updated`}
                          {op.op === "remove" && `Removed`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {pending && (
              <div className="mb-2.5 text-left">
                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--muted)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Editing your page...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Persistent bottom bar — always visible */}
      <div className="border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
              expanded
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-indigo-50 hover:text-indigo-600"
            )}
            title={expanded ? "Collapse AI panel" : "Expand AI panel"}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onFocus={() => {
                if (!expanded && messages.length === 0) setExpanded(true);
              }}
              placeholder={
                pending
                  ? "AI is working..."
                  : focusSectionId
                    ? `Edit ${focusSection?.type || "section"} — e.g. "make it more modern"...`
                    : "Ask AI — e.g. \"add a testimonials section\" or \"improve the copy\"..."
              }
              disabled={pending}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 pr-20 text-xs outline-none transition-colors placeholder:text-[var(--muted-foreground)]/60 focus:border-[var(--primary)] disabled:opacity-50"
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {!expanded && messages.length > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  title="Show conversation"
                >
                  <MessageSquare className="h-3 w-3" />
                  {messages.filter((m) => m.role === "assistant").length}
                </button>
              )}
              {canUndo && !expanded && (
                <button
                  onClick={onUndo}
                  className="rounded p-1 text-[var(--muted-foreground)] hover:text-amber-600 transition-colors"
                  title="Undo AI changes"
                >
                  <Undo2 className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={pending || !prompt.trim()}
                className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] transition-all hover:opacity-90 disabled:opacity-30"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Quick action pills when collapsed and no messages */}
          {!expanded && messages.length === 0 && !pending && (
            <div className="hidden items-center gap-1 lg:flex">
              {(focusSectionId ? SECTION_QUICK_ACTIONS.slice(0, 3) : QUICK_ACTIONS.slice(0, 3)).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  className="whitespace-nowrap rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-medium text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
