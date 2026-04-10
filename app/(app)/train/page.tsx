import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function TrainPage() {
  return (
    <>
      <PageHeader
        title="Train"
        description="Your training plan, your workouts, your goal race."
      />
      <ComingSoon
        phase="Phase 2A–2E"
        feature="Training plans & sync"
        description="Build a plan around your goal race, or sync an existing plan from TrainingPeaks or Final Surge. Open individual workouts to friends with one toggle, and let our AI coach help you adjust the week when life happens."
        checklist={[
          "Create a goal race plan with target time and visibility",
          "Day-by-day workout builder with pace, distance, time, and location",
          "'Open to Friends' toggle on any workout → instant run invite",
          "Sync plans from TrainingPeaks / Final Surge via OAuth2",
          "Auto-link completed Strava activities to scheduled workouts",
        ]}
      />
    </>
  );
}
