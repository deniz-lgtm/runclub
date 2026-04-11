import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string; // small all-caps label above the title (e.g. "INDEX")
  children?: React.ReactNode; // action buttons, filters, etc.
  className?: string;
}

/**
 * Per-page header — editorial magazine treatment.
 *
 * Optional `eyebrow` small-caps label above the title (like a section
 * kicker in a magazine), big display title, thin ink-muted description.
 * Actions live in the children slot on the right.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 px-4 pt-6 pb-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && <div className="label-bib mb-1">{eyebrow}</div>}
          <h1 className="font-display text-3xl font-black leading-[0.95] tracking-tightest text-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm leading-snug text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>
    </div>
  );
}
