import { createSupabaseServerClient } from "@/lib/supabase/server";

const DAILY_GENERATION_LIMIT = 3;

/**
 * Count how many generations the current user has attempted in the
 * last 24 hours. Used to enforce the free-tier rate limit before we
 * burn Anthropic credits.
 */
export async function getRecentGenerationCount(): Promise<number> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const since = new Date();
  since.setHours(since.getHours() - 24);

  const { count } = await supabase
    .from("ai_plan_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since.toISOString());

  return count ?? 0;
}

/**
 * Record a generation attempt. Called both on success and failure so
 * the rate limit applies even to failed attempts (otherwise a broken
 * API key would let users hammer Claude indefinitely).
 */
export async function recordGeneration(args: {
  status: "success" | "failed" | "accepted";
  methodology?: string;
  goal_race?: string;
  total_weeks?: number;
  plan_id?: string | null;
  error_message?: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("ai_plan_generations").insert({
    user_id: user.id,
    status: args.status,
    methodology: args.methodology ?? null,
    goal_race: args.goal_race ?? null,
    total_weeks: args.total_weeks ?? null,
    plan_id: args.plan_id ?? null,
    error_message: args.error_message ?? null,
  });
}

/** True if the current user has room in their daily rate limit. */
export async function canGenerateNewPlan(): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const used = await getRecentGenerationCount();
  const remaining = Math.max(0, DAILY_GENERATION_LIMIT - used);
  return {
    allowed: remaining > 0,
    remaining,
    limit: DAILY_GENERATION_LIMIT,
  };
}
