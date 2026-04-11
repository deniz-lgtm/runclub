import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrainingPlan } from "@/lib/types";
import { ChevronRight } from "lucide-react";

/**
 * Plan card — race-bib row treatment with a thick status stripe.
 */
export function PlanCard({ plan }: { plan: TrainingPlan }) {
  return (
    <Link
      href={`/train/${plan.id}`}
      className="group relative flex items-center gap-3 overflow-hidden rounded-sm border border-ink/15 bg-surface p-4 transition-colors hover:border-ink"
    >
      {/* Status accent stripe */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          plan.status === "active" && "bg-flash",
          plan.status === "paused" && "bg-ink/20",
          plan.status === "completed" && "bg-ink",
        )}
      />

      <div className="min-w-0 flex-1 pl-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-sm font-extrabold tracking-tight text-ink">
            {plan.title}
          </h3>
          {plan.status !== "active" && (
            <Badge variant="muted">{plan.status}</Badge>
          )}
          {plan.sync_source !== "none" && (
            <Badge variant="solid">
              {plan.sync_source === "trainingpeaks" ? "TP" : "FS"}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
          {plan.goal_race ?? "No goal race"}
          {plan.goal_race_date && ` · ${formatDate(plan.goal_race_date)}`}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted group-hover:text-ink" />
    </Link>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
