import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft, Sparkles, Wrench, Plug } from "lucide-react";

/**
 * New plan chooser — three paths to a training plan:
 *   01 · Manual      — you build it workout by workout
 *   02 · AI Coach    — describe your goal, AI builds a full plan
 *   03 · Sync        — pull from TrainingPeaks / Final Surge
 */
export default async function NewPlanPage() {
  await requireProfile();

  return (
    <>
      <PageHeader
        eyebrow="Train"
        title="New plan"
        description="Three ways to get a plan. Pick your path."
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/train">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="column space-y-3">
        <ChooserCard
          href="/train/new/ai"
          index="01"
          icon={<Sparkles className="h-5 w-5" />}
          title="AI coach"
          description="Tell me your goal race, your fitness, and your schedule. I'll build a full periodized plan with specific workouts, tailored to your methodology of choice."
          highlight
        />
        <ChooserCard
          href="/train/new/manual"
          index="02"
          icon={<Wrench className="h-5 w-5" />}
          title="Manual"
          description="Build your plan workout by workout. Full control. Best if you know exactly what you want or you're adapting a plan you already have."
        />
        <ChooserCard
          href="/profile/settings/connections"
          index="03"
          icon={<Plug className="h-5 w-5" />}
          title="Sync"
          description="Import your plan from TrainingPeaks or Final Surge. Your coach builds it there, you live it here. (Requires connection setup.)"
        />
      </div>
    </>
  );
}

function ChooserCard({
  href,
  index,
  icon,
  title,
  description,
  highlight,
}: {
  href: string;
  index: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "group relative block overflow-hidden rounded-sm border transition-colors " +
        (highlight
          ? "border-ink bg-ink text-white hover:bg-ink-soft"
          : "border-ink/15 bg-surface text-ink hover:border-ink")
      }
    >
      {highlight && (
        <div className="h-1 w-full bg-flash" aria-hidden />
      )}
      <div className="flex items-start gap-4 p-5">
        {/* Index stamp */}
        <div
          className={
            "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xs border " +
            (highlight
              ? "border-flash/40 bg-transparent text-flash"
              : "border-ink/20 bg-bone-soft text-ink")
          }
        >
          <span className="font-mono text-[11px] font-bold tabular-nums">
            {index}
          </span>
          <div className="mt-0.5 [&_svg]:h-3 [&_svg]:w-3">{icon}</div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-black leading-none tracking-tightest">
            {title}
          </h3>
          <p
            className={
              "mt-2 text-xs leading-snug " +
              (highlight ? "text-white/70" : "text-ink-muted")
            }
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
