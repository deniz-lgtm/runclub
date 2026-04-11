import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildCoachContext } from "@/lib/queries/coach";
import { hasAnthropicKey, runCoachTurn, type CoachMessage } from "@/lib/ai";

/**
 * AI coach turn endpoint.
 *
 * POST { thread_id?, messages } → { reply, thread_id }
 *
 * - If thread_id is missing, creates a new thread and returns its id.
 * - Appends the user's new message + the assistant's reply to the
 *   thread's `messages` JSON column so the whole conversation is
 *   persisted.
 * - Falls back to a fixture reply if ANTHROPIC_API_KEY isn't set, so
 *   the UI still demonstrates the experience in dev.
 */
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = (await request.json()) as {
    thread_id?: string;
    messages: CoachMessage[];
  };

  if (!body.messages || body.messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  // Build the full coach context (profile + plan + recent + upcoming).
  const context = await buildCoachContext();
  if (!context) {
    return NextResponse.json(
      { error: "Profile not found. Complete onboarding first." },
      { status: 400 },
    );
  }

  // Generate the assistant's reply.
  let reply: string;
  try {
    if (hasAnthropicKey()) {
      reply = await runCoachTurn(body.messages, context);
    } else {
      // Dev-mode fallback — a canned reply so the UI still works.
      reply = fallbackReply(body.messages[body.messages.length - 1]);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Coach failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Persist the turn (append user message + reply to the thread).
  const updatedMessages: CoachMessage[] = [
    ...body.messages,
    { role: "assistant", content: reply },
  ];

  let threadId = body.thread_id;
  if (!threadId) {
    const title = deriveTitle(body.messages[0]?.content ?? "New chat");
    const { data, error } = await supabase
      .from("ai_coaching_threads")
      .insert({
        user_id: user.id,
        title,
        messages: updatedMessages,
      })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    threadId = data.id as string;
  } else {
    const { error } = await supabase
      .from("ai_coaching_threads")
      .update({ messages: updatedMessages })
      .eq("id", threadId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ reply, thread_id: threadId });
}

/** Strip/truncate the first user message to form a thread title. */
function deriveTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 60) return trimmed;
  return trimmed.slice(0, 57) + "…";
}

/** Dev-mode canned reply for when no Anthropic key is configured. */
function fallbackReply(lastMessage: CoachMessage): string {
  const q = lastMessage.content.toLowerCase();
  if (q.includes("plan")) {
    return "I can't build a real plan without an ANTHROPIC_API_KEY, but here's the shape of what I'd recommend: 4-6 weeks of base, 4 weeks of threshold work, a 10-day taper. Add the key to .env.local and I'll get specific about paces + weekly mileage for your goal.";
  }
  if (q.includes("injury") || q.includes("pain")) {
    return "Any running pain that persists more than 3 runs in a row is worth getting looked at by a sports PT. In the meantime: reduce volume by 30-50%, ice 10-15 min after runs, and focus on glute/calf strength. (This is a preview response — add ANTHROPIC_API_KEY to get real coaching.)";
  }
  return `This is a preview response — add ANTHROPIC_API_KEY to .env.local to get real coaching. Your question: "${lastMessage.content}"`;
}
