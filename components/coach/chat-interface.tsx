"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Sparkles } from "lucide-react";
import type { CoachMessage } from "@/lib/ai";

interface ChatInterfaceProps {
  initialThreadId?: string | null;
  initialMessages?: CoachMessage[];
  hasAnthropicKey: boolean;
}

const QUICK_PROMPTS: Array<{ label: string; prompt: string }> = [
  {
    label: "Review my week",
    prompt:
      "Take a look at my last week of training and tell me what's going well and what to adjust.",
  },
  {
    label: "Am I ready for my race?",
    prompt: "How's my prep for my goal race so far? Am I on track?",
  },
  {
    label: "I'm feeling burned out",
    prompt:
      "I'm feeling burned out. Can you suggest how to adjust this week's plan to recover without falling behind?",
  },
  {
    label: "Long run fueling",
    prompt: "What should I eat before and during my long run this weekend?",
  },
];

/**
 * The AI coach chat surface.
 *
 * Stateless on the server — every turn POSTs the whole message array
 * to /api/ai/coach, which handles context injection, calls Claude,
 * persists the thread, and returns the new reply.
 */
export function ChatInterface({
  initialThreadId = null,
  initialMessages = [],
  hasAnthropicKey,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<CoachMessage[]>(initialMessages);
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setError(null);
    setSending(true);

    const userMessage: CoachMessage = { role: "user", content: text.trim() };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          messages: next,
        }),
      });
      const json = (await res.json()) as {
        reply?: string;
        thread_id?: string;
        error?: string;
      };
      if (json.error) throw new Error(json.error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply ?? "" },
      ]);
      if (json.thread_id) setThreadId(json.thread_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach failed.");
    } finally {
      setSending(false);
    }
  }

  function handleQuickPrompt(prompt: string) {
    send(prompt);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col">
      {/* Scrollable message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">AI running coach</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                I know your plan, your recent workouts, and your goal race.
                Ask me anything.
              </p>
            </div>
            {!hasAnthropicKey && (
              <div className="rounded-md border border-accent/40 bg-accent/10 p-2 text-[11px] text-muted-foreground">
                Running in preview mode. Add{" "}
                <code>ANTHROPIC_API_KEY</code> for real replies.
              </div>
            )}
            <div className="mt-2 flex w-full flex-col gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleQuickPrompt(p.prompt)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs font-semibold transition-colors hover:border-primary/40"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {sending && (
          <div className="my-2 flex items-center gap-1 px-2">
            <Dot /> <Dot delay={100} /> <Dot delay={200} />
          </div>
        )}

        {error && (
          <p className="my-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-surface/95 p-3 backdrop-blur"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          disabled={sending}
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !input.trim()}
          className="h-11 w-11 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "my-2 flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-surface",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
      style={{ animation: `pulse 1.2s ${delay}ms infinite` }}
    />
  );
}
