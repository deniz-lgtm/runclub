interface ComingSoonProps {
  phase: string;
  feature: string;
  description: string;
  checklist?: string[];
}

/**
 * Phase stub. Editorial "prototype" sheet with hairline dashed border
 * and an indexed checklist of what's coming.
 */
export function ComingSoon({
  phase,
  feature,
  description,
  checklist,
}: ComingSoonProps) {
  return (
    <div className="column">
      <div className="rounded-sm border border-dashed border-ink/30 bg-surface p-6">
        <div className="flex items-center justify-between">
          <span className="label-bib">{phase}</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
            Prototype
          </span>
        </div>
        <h2 className="mt-2 font-display text-2xl font-black leading-[0.95] tracking-tightest text-ink">
          {feature}
        </h2>
        <p className="mt-3 text-sm leading-snug text-ink-muted">
          {description}
        </p>
        {checklist && checklist.length > 0 && (
          <>
            <div className="mt-5 flex items-center gap-2">
              <div className="h-px flex-1 bg-ink/15" />
              <span className="label-bib">Scope</span>
              <div className="h-px flex-1 bg-ink/15" />
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {checklist.map((item, i) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span className="bib shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="leading-snug text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
