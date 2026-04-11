import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";
import { requireProfile } from "@/lib/auth";

/**
 * Premium tier landing — Phase 6 scaffold.
 *
 * Premium unlocks advanced AI coaching, detailed analytics, and coach
 * tools for managing multiple athletes. Pricing + Stripe integration
 * land here when Phase 6 ships.
 */
export default async function PremiumPage() {
  await requireProfile();

  return (
    <>
      <PageHeader
        title="FWR Premium"
        description="Unlock advanced AI coaching and analytics."
      />
      <ComingSoon
        phase="Phase 6"
        feature="Premium tier"
        description="Unlimited AI coaching conversations, personalized plan generation, race-day prediction, and detailed analytics. For coaches: tools to manage multiple athletes, assign workouts, and track their progress."
        checklist={[
          "Unlimited AI coach conversations (free tier is capped)",
          "AI-generated custom training plans with goal-specific periodization",
          "Race readiness score + predicted finish time",
          "Weekly / monthly / plan-level analytics dashboards",
          "Coach tools: multi-athlete view, assignment, progress tracking",
          "Early access to new features",
        ]}
      />
    </>
  );
}
