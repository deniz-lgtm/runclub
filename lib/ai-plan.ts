/**
 * AI training plan generation.
 *
 * Separate from lib/ai.ts so the coach (conversational) and the plan
 * generator (structured output via tool use) can evolve independently.
 *
 * The generator uses Claude's tool-use feature to coerce structured
 * JSON output — we define a `submit_training_plan` tool, force Claude
 * to call it, and read the structured input as our plan. This is far
 * more reliable than parsing free-form text.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/ai";
import type { WorkoutType } from "@/lib/types";

export const PLAN_MODEL = "claude-sonnet-4-20250514";

// ────────────────────────────────────────────────────────────────────────────
// Input: what the runner tells us before we generate
// ────────────────────────────────────────────────────────────────────────────

export type Methodology =
  | "generalist"
  | "pfitzinger"
  | "hansons"
  | "daniels"
  | "couch_to_race"
  | "minimalist";

export interface PlanInput {
  goal_race: string; // free text, e.g. "Chicago Marathon"
  goal_distance: "5k" | "10k" | "half_marathon" | "marathon" | "ultra" | "other";
  goal_race_date: string; // ISO date
  goal_time?: string | null; // optional, free text e.g. "3:45:00"
  current_weekly_miles: number;
  longest_recent_run_miles: number;
  recent_race?: {
    distance: string;
    time: string;
  } | null;
  days_per_week: number; // 3-6
  protected_rest_days: string[]; // ["monday", "wednesday"]
  injuries_or_notes?: string | null;
  methodology: Methodology;
  pace_style: "conversational" | "specific" | "both";
}

// ────────────────────────────────────────────────────────────────────────────
// Methodology descriptions — injected into the system prompt
// ────────────────────────────────────────────────────────────────────────────

export const METHODOLOGY_PRESETS: Record<
  Methodology,
  { name: string; blurb: string; instructions: string }
> = {
  generalist: {
    name: "Generalist",
    blurb: "Balanced 80/20 approach, draws from multiple methodologies.",
    instructions: `Use a balanced 80/20 approach (80% easy, 20% hard) drawing from modern endurance coaching. Apply sensible progressive overload: long runs grow by no more than ~1 mile per week with a cutback week every 3-4 weeks. Keep hard workouts to no more than 2 per week (tempo + intervals/hills). Taper is 2 weeks for half marathon, 3 weeks for marathon, 10-14 days otherwise.`,
  },
  pfitzinger: {
    name: "Pfitzinger",
    blurb: "Higher volume, medium-long runs, marathon-paced long runs.",
    instructions: `Follow Pete Pfitzinger's "Advanced Marathoning" approach: high-ish weekly volume, medium-long runs mid-week (12-15mi), marathon-pace segments inside long runs, lactate threshold workouts (15-20min at LT pace), and VO2max intervals later in the build. Minimal cross-training. Best for runners with a solid base who can handle 40-60mpw.`,
  },
  hansons: {
    name: "Hansons",
    blurb: "Cumulative fatigue method, 'tired legs' philosophy.",
    instructions: `Follow the Hansons Marathon Method: cumulative fatigue as the core principle — never a "fresh" long run. Long runs capped at 16 miles. Strength workouts (1200m-2000m repeats), speed workouts early in the build, tempo runs that sneak up to marathon pace. Six days per week is standard. Best for runners who can tolerate consistent mileage.`,
  },
  daniels: {
    name: "Daniels",
    blurb: "VDOT-based specific pace zones (E/M/T/I/R).",
    instructions: `Follow Jack Daniels' VDOT methodology: every workout paced via zones — E (Easy), M (Marathon), T (Threshold), I (Interval), R (Repetition). Include specific pace targets derived from the runner's recent race time or goal time. Use phrases like "4 miles E + 4 x 400m R with 400m jog recovery". Favors precision over feel.`,
  },
  couch_to_race: {
    name: "Couch-to-Race",
    blurb: "Beginner-safe, builds base slowly, walk breaks allowed.",
    instructions: `Beginner-friendly approach: start with run/walk intervals if weekly mileage is under 10mi. Build base safely — max +10% per week, cutback every 3rd week. Long runs progress slowly. Only one "quality" session per week (strides or light tempo) until the runner is consistently running 20+ mpw. Emphasize rest and recovery. Never sacrifice form or enjoyment for speed.`,
  },
  minimalist: {
    name: "Minimalist",
    blurb: "3-4 days/week, focused quality, for busy runners.",
    instructions: `Minimalist approach for runners with limited time: 3-4 days per week maximum. Each run earns its keep — one long run, one quality session (tempo or intervals), one or two easy runs. Optional cross-training on off days. Emphasize consistency over volume. Works well for 5K-half marathon goals; marathoners on this plan should extend the build to give long runs time to accumulate.`,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// System prompt
// ────────────────────────────────────────────────────────────────────────────

export const PLAN_SYSTEM_PROMPT = `You are an expert running coach building a personalized training plan for a runner on the Friends Who Run app. You draw on deep knowledge of endurance physiology, periodization, and race preparation.

You will be given:
- The runner's current fitness (weekly mileage, longest recent run, recent race if any)
- Their goal race, race date, and target time (if any)
- Days they can run per week, and any protected rest days
- Any injuries or limitations
- A selected methodology — follow its principles strictly

Your job: produce a full week-by-week training plan from today through race day. The plan must be:

1. SAFE — Progressive overload with no more than ~10% week-over-week volume jumps. Include cutback weeks every 3rd or 4th week.
2. STRUCTURED — Proper periodization: base phase (building aerobic fitness), build phase (adding specific race-pace work), peak phase (highest workload), taper (reduced volume to arrive fresh at race day).
3. REALISTIC — Respect the runner's current fitness. Don't prescribe 50mpw weeks to someone running 15. Don't prescribe tempo runs at paces they can't hit.
4. SPECIFIC — Every workout should have a clear title, description, target distance, and when relevant, a target pace. The description should be concrete enough that the runner knows exactly what to do.
5. METHODOLOGICALLY CONSISTENT — Follow the selected methodology's core principles.

Workout types (use the exact values):
- easy        : conversational-pace aerobic run
- long_run    : the weekly long run
- tempo       : sustained threshold-pace effort
- intervals   : VO2max or speed intervals
- hills       : hill repeats or hill progression
- recovery    : very easy shakeout run
- race        : the goal race day
- cross_training : non-running aerobic work (bike, swim, etc.)
- rest        : no activity

Pace style instructions will be provided in the context. Follow them:
- "conversational": describe paces in words only ("easy effort", "conversationally hard", "5K effort")
- "specific": use concrete pace ranges ("7:45-8:00/mi", derived from the runner's goal time or recent race)
- "both": include words first, specific pace as a secondary line ("Conversational — 8:30-9:00/mi")

Call the submit_training_plan tool exactly once with your structured plan. Do not reply in free-form text — the tool call IS your response.`;

// ────────────────────────────────────────────────────────────────────────────
// Tool schema — what Claude returns
// ────────────────────────────────────────────────────────────────────────────

const WORKOUT_TYPES: WorkoutType[] = [
  "easy",
  "long_run",
  "tempo",
  "intervals",
  "hills",
  "recovery",
  "race",
  "cross_training",
  "rest",
];

export interface GeneratedWorkout {
  day_offset: number; // 0-6 relative to week start (monday)
  type: WorkoutType;
  title: string;
  description: string;
  target_distance_miles: number | null;
  target_pace: string | null;
  target_duration_minutes: number | null;
}

export interface GeneratedWeek {
  week_number: number;
  phase: "base" | "build" | "peak" | "taper" | "race_week";
  focus: string;
  target_miles: number;
  workouts: GeneratedWorkout[];
}

export interface GeneratedPlan {
  title: string;
  summary: string;
  total_weeks: number;
  peak_weekly_miles: number;
  methodology: string;
  weeks: GeneratedWeek[];
}

const PLAN_TOOL = {
  name: "submit_training_plan",
  description:
    "Submit a complete week-by-week training plan for the runner. Call this exactly once.",
  input_schema: {
    type: "object" as const,
    required: [
      "title",
      "summary",
      "total_weeks",
      "peak_weekly_miles",
      "methodology",
      "weeks",
    ],
    properties: {
      title: {
        type: "string",
        description:
          "A short, energetic plan title, e.g. 'Chicago Marathon Build — 16 Weeks'",
      },
      summary: {
        type: "string",
        description:
          "2-3 sentence plan overview. Explain the structure, peak mileage, and what the runner should expect.",
      },
      total_weeks: {
        type: "number",
        description: "Total number of weeks in the plan, including race week.",
      },
      peak_weekly_miles: {
        type: "number",
        description: "The highest planned weekly mileage in the plan.",
      },
      methodology: {
        type: "string",
        description: "Name of the methodology used.",
      },
      weeks: {
        type: "array",
        description:
          "Ordered list of weeks from week 1 to race week. Each week contains 7 days of workouts.",
        items: {
          type: "object",
          required: ["week_number", "phase", "focus", "target_miles", "workouts"],
          properties: {
            week_number: { type: "number" },
            phase: {
              type: "string",
              enum: ["base", "build", "peak", "taper", "race_week"],
            },
            focus: {
              type: "string",
              description:
                "One-line summary of what this week is about, e.g. 'Base + first tempo'",
            },
            target_miles: { type: "number" },
            workouts: {
              type: "array",
              description:
                "Exactly 7 workouts for this week, one per day, starting on Monday (day_offset 0) through Sunday (day_offset 6).",
              items: {
                type: "object",
                required: [
                  "day_offset",
                  "type",
                  "title",
                  "description",
                  "target_distance_miles",
                  "target_pace",
                  "target_duration_minutes",
                ],
                properties: {
                  day_offset: {
                    type: "number",
                    description:
                      "0 = Monday, 1 = Tuesday, ..., 6 = Sunday. Must be unique within a week.",
                  },
                  type: {
                    type: "string",
                    enum: WORKOUT_TYPES,
                  },
                  title: {
                    type: "string",
                    description:
                      "Short workout title, e.g. '6x800m @ 5K pace' or 'Easy 5 mi'",
                  },
                  description: {
                    type: "string",
                    description:
                      "Concrete instructions. For intervals include rep count, distance, rest. For rest days include 'No activity.'",
                  },
                  target_distance_miles: {
                    type: ["number", "null"],
                    description:
                      "Target distance in miles. null for rest days and cross-training.",
                  },
                  target_pace: {
                    type: ["string", "null"],
                    description:
                      "Pace guidance per pace_style (words, specific, or both).",
                  },
                  target_duration_minutes: {
                    type: ["number", "null"],
                    description:
                      "Target duration in minutes. null when distance is the primary target.",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Context formatter — what we tell Claude about the runner
// ────────────────────────────────────────────────────────────────────────────

function formatPlanInput(input: PlanInput): string {
  const preset = METHODOLOGY_PRESETS[input.methodology];
  const lines: string[] = [];

  lines.push("# Runner input");
  lines.push(`- Goal race: ${input.goal_race} (${input.goal_distance})`);
  lines.push(`- Goal race date: ${input.goal_race_date}`);
  if (input.goal_time) lines.push(`- Goal time: ${input.goal_time}`);
  lines.push(`- Current weekly mileage: ${input.current_weekly_miles} mi`);
  lines.push(
    `- Longest recent run: ${input.longest_recent_run_miles} mi`,
  );
  if (input.recent_race) {
    lines.push(
      `- Recent race: ${input.recent_race.distance} in ${input.recent_race.time}`,
    );
  }
  lines.push(`- Days per week: ${input.days_per_week}`);
  if (input.protected_rest_days.length > 0) {
    lines.push(
      `- Protected rest days: ${input.protected_rest_days.join(", ")}`,
    );
  }
  if (input.injuries_or_notes) {
    lines.push(`- Injuries / notes: ${input.injuries_or_notes}`);
  }

  lines.push("");
  lines.push("# Methodology");
  lines.push(`- Selected: ${preset.name}`);
  lines.push(`- Instructions: ${preset.instructions}`);

  lines.push("");
  lines.push("# Pace style");
  lines.push(`- Style: ${input.pace_style}`);
  lines.push(
    input.pace_style === "conversational"
      ? "- Use effort-based descriptions only. No numeric pace targets."
      : input.pace_style === "specific"
        ? "- Use concrete pace ranges derived from the runner's goal time or recent race. E.g. '7:45-8:00/mi'."
        : "- Include effort-based words first, then specific pace in parentheses when relevant.",
  );

  lines.push("");
  lines.push("# Your task");
  lines.push(
    "Build the full week-by-week plan from now through race day. Call submit_training_plan with your complete plan.",
  );

  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// The main call
// ────────────────────────────────────────────────────────────────────────────

/**
 * Generate a full training plan for the given input.
 *
 * Returns the structured plan. Throws on any Claude error or if
 * Claude refuses to call the tool (shouldn't happen given how the
 * prompt is structured, but we guard against it).
 */
export async function generatePlan(input: PlanInput): Promise<GeneratedPlan> {
  const client = getAnthropicClient();
  const userText = formatPlanInput(input);

  const response = await client.messages.create({
    model: PLAN_MODEL,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: PLAN_SYSTEM_PROMPT,
        // @ts-expect-error cache_control is a beta feature
        cache_control: { type: "ephemeral" },
      },
    ],
    // @ts-expect-error tools is part of the Anthropic tool-use API
    tools: [PLAN_TOOL],
    // @ts-expect-error tool_choice forces Claude to call our tool
    tool_choice: { type: "tool", name: "submit_training_plan" },
    messages: [
      {
        role: "user",
        content: userText,
      },
    ],
  });

  // Extract the tool_use block from the response.
  const toolUse = response.content.find(
    (
      block,
    ): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === "submit_training_plan",
  );

  if (!toolUse) {
    throw new Error(
      "Claude did not call submit_training_plan — plan generation failed.",
    );
  }

  const plan = toolUse.input as GeneratedPlan;

  // Light validation — the schema should handle most of this but we
  // don't trust Claude to always get it perfect.
  if (!plan.weeks || !Array.isArray(plan.weeks) || plan.weeks.length === 0) {
    throw new Error("Generated plan has no weeks.");
  }
  for (const week of plan.weeks) {
    if (!week.workouts || week.workouts.length === 0) {
      throw new Error(`Week ${week.week_number} has no workouts.`);
    }
  }

  return plan;
}
