import Anthropic from "@anthropic-ai/sdk";
import type { Profile, TrainingPlan, TrainingPlanWorkout } from "@/lib/types";

/**
 * Anthropic Claude client + context builder for the AI coach.
 *
 * The coach's quality depends entirely on the context we inject.
 * Every message includes: the runner's profile, their active plan
 * (if any), the last 2 weeks of workouts, and upcoming scheduled
 * workouts. This is the non-negotiable minimum for non-generic advice.
 *
 * Uses prompt caching on the big system prompt + profile block so we
 * pay for it once per conversation instead of every turn.
 */

export const COACH_MODEL = "claude-sonnet-4-6";

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to use the AI coach.",
    );
  }
  return new Anthropic({ apiKey });
}

// ────────────────────────────────────────────────────────────────────────────
// System prompt — verbatim from the Phase 2C spec in CLAUDE.md.
// ────────────────────────────────────────────────────────────────────────────

export const COACH_SYSTEM_PROMPT = `You are an expert running coach inside the Friends Who Run app. You have deep knowledge of running physiology, periodization, race preparation, injury prevention, nutrition, and mental performance.

You have access to this runner's profile and training data (provided in each message as context). Use their actual training history, upcoming races, and goals to give personalized, actionable advice.

Your coaching style:
- Encouraging but honest — don't sugarcoat if they're overtraining or skipping workouts
- Conversational and warm, like a coach who genuinely knows and cares about the runner
- Reference their specific workouts: "I see your tempo on Tuesday was faster than prescribed — nice work, but let's make sure Thursday's easy run is truly easy"
- Give concrete paces, distances, and recovery advice — not generic platitudes
- If they ask for a training plan, build one that's specific to their goal race, current fitness, and schedule
- Use running terminology naturally (fartlek, negative split, strides, cadence, etc.)
- When discussing injury concerns, always recommend seeing a professional for diagnosis but offer general guidance on common running issues

You are NOT a medical professional. For injury or health concerns, always recommend consulting a doctor or physical therapist.`;

// ────────────────────────────────────────────────────────────────────────────
// Context builder
// ────────────────────────────────────────────────────────────────────────────

export interface CoachContext {
  profile: Profile;
  activePlan: TrainingPlan | null;
  recentWorkouts: TrainingPlanWorkout[]; // last 14 days
  upcomingWorkouts: TrainingPlanWorkout[]; // next 14 days
}

const DISTANCE_LABELS: Record<string, string> = {
  sprints: "Sprints / track",
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half marathon",
  marathon: "Marathon",
  ultra: "Ultra",
};

/**
 * Format the runner's context as a compact text block for injection
 * into every coach message. Kept readable for the model — not JSON.
 */
export function formatCoachContext(ctx: CoachContext): string {
  const { profile, activePlan, recentWorkouts, upcomingWorkouts } = ctx;

  const lines: string[] = [];
  lines.push("# Runner profile");
  lines.push(`- Name: ${profile.display_name ?? profile.username}`);
  lines.push(
    `- Primary distance: ${profile.preferred_distance ? (DISTANCE_LABELS[profile.preferred_distance] ?? profile.preferred_distance) : "not specified"}`,
  );
  lines.push(
    `- Weekly mileage goal: ${profile.weekly_mileage_goal ?? "not specified"}`,
  );
  lines.push(
    `- Location: ${[profile.city, profile.state].filter(Boolean).join(", ") || "not specified"}`,
  );
  if (profile.current_shoe) lines.push(`- Current shoe: ${profile.current_shoe}`);
  if (profile.bio) lines.push(`- Bio: ${profile.bio}`);

  if (activePlan) {
    lines.push("");
    lines.push("# Active plan");
    lines.push(`- Title: ${activePlan.title}`);
    if (activePlan.goal_race)
      lines.push(`- Goal race: ${activePlan.goal_race}`);
    if (activePlan.goal_race_date)
      lines.push(`- Goal date: ${activePlan.goal_race_date}`);
    if (activePlan.sync_source !== "none")
      lines.push(`- Source: ${activePlan.sync_source}`);
  } else {
    lines.push("");
    lines.push("# Active plan");
    lines.push("- None. This runner is self-guided for now.");
  }

  if (recentWorkouts.length > 0) {
    lines.push("");
    lines.push("# Last 14 days of workouts");
    for (const w of recentWorkouts) {
      lines.push(formatWorkoutLine(w));
    }
  }

  if (upcomingWorkouts.length > 0) {
    lines.push("");
    lines.push("# Next 14 days of scheduled workouts");
    for (const w of upcomingWorkouts) {
      lines.push(formatWorkoutLine(w));
    }
  }

  return lines.join("\n");
}

function formatWorkoutLine(w: TrainingPlanWorkout): string {
  const status = w.is_completed ? "✓" : "·";
  const core = `${status} ${w.scheduled_date} [${w.workout_type}] ${w.title}`;
  const extras: string[] = [];
  if (w.target_distance_miles != null)
    extras.push(`target ${w.target_distance_miles}mi`);
  if (w.is_completed && w.actual_distance_miles != null)
    extras.push(`ran ${w.actual_distance_miles}mi`);
  if (w.effort_rating != null) extras.push(`effort ${w.effort_rating}/10`);
  return extras.length ? `${core} (${extras.join(", ")})` : core;
}

// ────────────────────────────────────────────────────────────────────────────
// Message streaming helper
// ────────────────────────────────────────────────────────────────────────────

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Call Claude with the full coach context. Non-streaming (simpler for
 * Phase 2C — upgrade to streaming later).
 *
 * Prompt caching is applied to the system prompt + runner context so
 * those tokens are cached across turns in the same conversation.
 */
export async function runCoachTurn(
  messages: CoachMessage[],
  context: CoachContext,
): Promise<string> {
  const client = getAnthropicClient();
  const contextText = formatCoachContext(context);

  const response = await client.messages.create({
    model: COACH_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: COACH_SYSTEM_PROMPT,
        // @ts-expect-error - cache_control is a beta feature
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: `<runner_context>\n${contextText}\n</runner_context>`,
        // @ts-expect-error - cache_control is a beta feature
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Extract the text content from the response.
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("\n");

  return text;
}
