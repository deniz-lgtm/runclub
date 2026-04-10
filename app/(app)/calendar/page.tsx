import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Your schedule, your friends' runs, and club events — all in one place."
      />
      <ComingSoon
        phase="Phase 1C"
        feature="The hero calendar"
        description="A custom week/month calendar that shows your workouts color-coded by type, friends' scheduled runs as smaller indicators, and club events with a 🏁 marker on race days. The calendar is the product — everything else layers on top of it."
        checklist={[
          "Week view (default) and month view toggle",
          "Workout types color-coded: easy (green), long run (blue), intervals (red), tempo (amber), rest (gray)",
          "Friends' scheduled runs show as small dots below your workouts",
          "Tap any day to see details; tap a friend's run to join it",
          "Today's workout pinned to a prominent card above the grid",
        ]}
      />
    </>
  );
}
