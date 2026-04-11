import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/training/plan-form";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

export default async function NewPlanPage() {
  await requireProfile();

  return (
    <>
      <PageHeader
        title="New plan"
        description="Build a plan around your next race."
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/train">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4">
        <Card>
          <CardContent className="p-5">
            <PlanForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
