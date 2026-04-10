import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  phase: string; // e.g. "Phase 1C"
  feature: string; // e.g. "The hero calendar"
  description: string;
  checklist?: string[];
}

/**
 * Phase 1A tab stub. Communicates *what* is coming and *when* so this
 * isn't just a blank screen while we build out the rest of the app.
 */
export function ComingSoon({
  phase,
  feature,
  description,
  checklist,
}: ComingSoonProps) {
  return (
    <div className="w-full px-4">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-start gap-3 p-6">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {phase}
          </span>
          <h2 className="text-xl font-semibold leading-tight">{feature}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          {checklist && checklist.length > 0 && (
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
