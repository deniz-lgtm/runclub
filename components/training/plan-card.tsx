import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrainingPlan } from "@/lib/types";
import { ChevronRight } from "lucide-react";

/**
 * Compact card for the Train tab list. Shows title, goal race, race
 * date, status, and sync source (if any). Tapping the card navigates
 * to the plan detail.
 */
export function PlanCard({ plan }: { plan: TrainingPlan }) {
  return (
    <Link
      href={`/train/${plan.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      {/* Status accent */}
      <div
        className={cn(
          "h-10 w-1 shrink-0 rounded-full",
          plan.status === "active" && "bg-primary",
          plan.status === "paused" && "bg-muted-foreground/40",
          plan.status === "completed" && "bg-secondary",
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">{plan.title}</h3>
          {plan.status !== "active" && (
            <Badge variant="muted" className="capitalize">
              {plan.status}
            </Badge>
          )}
          {plan.sync_source !== "none" && (
            <Badge variant="secondary" className="text-[9px]">
              {plan.sync_source === "trainingpeaks" ? "TP" : "FS"}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {plan.goal_race ?? "No goal race"}
          {plan.goal_race_date && ` • ${formatDate(plan.goal_race_date)}`}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
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
