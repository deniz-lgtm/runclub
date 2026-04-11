import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/training/plan-form";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

/**
 * Manual plan creation — the runner builds the plan workout by
 * workout. This used to live at /train/new before we added the
 * chooser + AI path.
 */
export default async function NewManualPlanPage() {
  await requireProfile();

  return (
    <>
      <PageHeader
        eyebrow="Train"
        title="Manual plan"
        description="Build it workout by workout."
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/train/new">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="column">
        <Card>
          <CardContent className="p-5">
            <PlanForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
