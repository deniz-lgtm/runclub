import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { DayDetail } from "@/components/calendar/day-detail";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromISODate, formatLongDate, toISODate } from "@/lib/date-utils";
import {
  MOCK_FRIEND_RUNS,
  MOCK_CLUB_EVENTS,
} from "@/lib/mock-data";
import type { TrainingPlanWorkout } from "@/lib/types";
import { ChevronLeft } from "lucide-react";

/**
 * Dedicated day detail page — /calendar/2026-04-12
 *
 * Shows everything happening on a specific day: your workout,
 * friends' runs, club events, with Join/RSVP actions. Navigated
 * to by tapping a day in the week or month view.
 */
export default async function CalendarDayPage({
  params,
}: {
  params: { date: string };
}) {
  await requireProfile();

  const date = fromISODate(params.date);
  const iso = toISODate(date);

  // Fetch the user's workout for this day (real data).
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let workout: TrainingPlanWorkout | null = null;
  if (user) {
    const { data } = await supabase
      .from("training_plan_workouts")
      .select(
        "*, training_plans!inner(user_id, status)",
      )
      .eq("training_plans.user_id", user.id)
      .eq("training_plans.status", "active")
      .eq("scheduled_date", iso)
      .limit(1)
      .maybeSingle();

    workout = (data as TrainingPlanWorkout | null) ?? null;
  }

  // Friends' runs and club events — mocked for now.
  const friendRuns = MOCK_FRIEND_RUNS.filter((r) => r.date === iso);
  const clubEvents = MOCK_CLUB_EVENTS.filter((e) => e.date === iso);

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title={formatLongDate(date)}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="column">
        <DayDetail
          date={date}
          workout={workout}
          friendRuns={friendRuns}
          clubEvents={clubEvents}
        />
      </div>
    </>
  );
}
