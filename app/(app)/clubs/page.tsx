import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function ClubsPage() {
  return (
    <>
      <PageHeader
        title="Clubs"
        description="Find your crew. Run clubs are the heartbeat of the running world."
      />
      <ComingSoon
        phase="Phase 3"
        feature="Run clubs & events"
        description="Discover clubs in your city, join with one tap, and see every club event on your calendar automatically. Club admins get first-class tools for organizing recurring group runs, announcements, and spotlighting members."
        checklist={[
          "Browse clubs by city, search by name, join open clubs instantly",
          "Club page with description, upcoming events, and member highlights",
          "Create events with meetup pin, pace, distance, and recurrence (iCal RRULE)",
          "RSVPs flow into members' calendars automatically",
          "Admin tools: manage members, roles, and announcements",
        ]}
      />
    </>
  );
}
