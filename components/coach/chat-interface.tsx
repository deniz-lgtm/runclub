"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
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
    label: "Am I ready?",
    prompt: "How's my prep for my goal race so far? Am I on track?",
  },
  {
    label: "I'm burned out",
    prompt:
      "I'm feeling burned out. Can you suggest how to adjust this week's plan to recover without falling behind?",
  },
  {
    label: "Long run fueling",
    prompt: "What should I eat before and during my long run this weekend?",
  },
];

/**
 * AI coach chat surface — editorial treatment.
 *
 * Ink message bubbles for the user, hairline-bordered bone bubbles
 * for the coach, mono timestamps, sharp composer with an ink Send
 * button.
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
        body: JSON.stringify({ thread_id: threadId, messages: next }),
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-2 pb-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col gap-4 py-2">
            {/* Intro */}
            <div className="rounded-sm border border-ink bg-ink p-5 text-white">
              <div className="label-bib text-flash">Coach</div>
              <h3 className="mt-1 font-display text-2xl font-black leading-none tracking-tightest">
                Ask anything.
              </h3>
              <p className="mt-2 text-sm text-white/70">
                I see your plan, your recent workouts, and your goal race.
                Real coaching, not generic tips.
              </p>
              {!hasAnthropicKey && (
                <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-bib text-flash">
                  Preview mode · add ANTHROPIC_API_KEY for real replies
                </p>
              )}
            </div>

            {/* Quick prompts */}
            <div>
              <div className="label-bib mb-2">Start with</div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleQuickPrompt(p.prompt)}
                    className="group flex flex-col items-start gap-2 rounded-sm border border-ink/15 bg-surface p-3 text-left transition-colors hover:border-ink hover:bg-ink hover:text-white"
                  >
                    <span className="bib group-hover:border-white/30 group-hover:bg-transparent group-hover:text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-xs font-extrabold uppercase tracking-bib">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
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
          <p className="my-2 rounded-xs border border-siren/40 bg-siren/5 p-2 font-mono text-[10px] uppercase tracking-bib text-siren">
            {error}
          </p>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-ink/10 bg-bone/95 p-3 backdrop-blur"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          disabled={sending}
          className="h-11 flex-1 rounded-xs border border-ink/20 bg-surface px-4 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !input.trim()}
          className="h-11 w-11"
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
    <div className={cn("my-2 flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-sm px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-ink text-white"
            : "border border-ink/15 bg-surface text-ink",
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
      className="h-1.5 w-1.5 rounded-none bg-ink"
      style={{ animation: `pulse 1.2s ${delay}ms infinite` }}
    />
  );
}
