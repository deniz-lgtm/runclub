import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AiPlanForm } from "@/components/training/ai-plan-form";
import { requireProfile } from "@/lib/auth";
import { canGenerateNewPlan } from "@/lib/queries/ai-plans";
import { hasAnthropicKey } from "@/lib/ai";
import { ChevronLeft } from "lucide-react";

export default async function NewAiPlanPage() {
  await requireProfile();
  const rate = await canGenerateNewPlan();

  return (
    <>
      <PageHeader
        eyebrow="Train"
        title="AI coach"
        description="Tell me about you. I'll build your plan."
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/train/new">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="column">
        {!hasAnthropicKey() && (
          <div className="mb-4 rounded-sm border border-flash/40 bg-flash/10 p-3">
            <div className="label-bib text-flash">Preview mode</div>
            <p className="mt-1 text-xs leading-snug text-ink-muted">
              Add <code className="font-mono text-[10px]">ANTHROPIC_API_KEY</code>{" "}
              to your Vercel env vars for real AI-generated plans. Without
              it the form will return an error.
            </p>
          </div>
        )}

        <AiPlanForm initialRemaining={rate.remaining} limit={rate.limit} />
      </div>
    </>
  );
}
