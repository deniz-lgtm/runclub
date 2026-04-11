import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanCard } from "@/components/training/plan-card";
import { getMyPlans } from "@/lib/queries/plans";
import { requireProfile } from "@/lib/auth";
import { Plus } from "lucide-react";

/**
 * Train tab — lists the current user's training plans, grouped
 * implicitly by status (active first since the query sorts that way).
 */
export default async function TrainPage() {
  await requireProfile();
  const plans = await getMyPlans();

  return (
    <>
      <PageHeader title="Train" description="Your plans, your goal races.">
        <Button size="sm" asChild>
          <Link href="/train/new">
            <Plus className="h-4 w-4" />
            New plan
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-3">
        {plans.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-base font-semibold">No plans yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Build a plan around your next goal race, or sync one in from
                TrainingPeaks or Final Surge.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild>
                  <Link href="/train/new">Create a plan</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/profile/settings/connections">
                    Sync from TrainingPeaks / Final Surge
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
            <p className="py-4 text-center text-[11px] text-muted-foreground">
              Need another plan? Tap{" "}
              <Link href="/train/new" className="text-primary hover:underline">
                New plan
              </Link>{" "}
              above.
            </p>
          </>
        )}
      </div>
    </>
  );
}
