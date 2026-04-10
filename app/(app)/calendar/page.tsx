import { PageHeader } from "@/components/layout/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { requireProfile } from "@/lib/auth";
import {
  defaultCalendarWindow,
  getMyWorkoutsForRange,
} from "@/lib/queries/workouts";
import {
  MOCK_CLUB_EVENTS,
  MOCK_FRIEND_RUNS,
  MOCK_WORKOUTS,
} from "@/lib/mock-data";

/**
 * Calendar tab.
 *
 * Server component: fetches the current user's workouts from Supabase
 * for a 5-week window around today. If the user has no workouts yet
 * (fresh account, no plan built), we fall back to the dev-mode
 * fixtures so the calendar never feels empty.
 *
 * Friends' runs and club events are still mocked in Phase 1C — Phase 2B
 * wires up real run invites, Phase 3 wires up real club events.
 */
export default async function CalendarPage() {
  await requireProfile();

  const { start, end } = defaultCalendarWindow();
  const realWorkouts = await getMyWorkoutsForRange(start, end);

  // Empty-state fallback: show the dev fixtures so the hero feature
  // demonstrates what it's capable of before the runner builds a plan.
  const workouts = realWorkouts.length > 0 ? realWorkouts : MOCK_WORKOUTS;
  const friendRuns = MOCK_FRIEND_RUNS;
  const clubEvents = MOCK_CLUB_EVENTS;

  return (
    <>
      <PageHeader
        title="Calendar"
        description={
          realWorkouts.length > 0
            ? "Your week, your crew, your goal race."
            : "Preview mode — build a plan to see your own workouts here."
        }
      />
      <CalendarView
        workouts={workouts}
        friendRuns={friendRuns}
        clubEvents={clubEvents}
      />
    </>
  );
}
