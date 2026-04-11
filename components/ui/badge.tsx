import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — small race-bib-inspired stamps.
 *
 * Default is ink-on-bone (like a printed tag). `flash` is the orange
 * accent. `outline` is the hairline-border stamp. `solid` is the
 * inverted ink-filled stamp for status labels like "DONE".
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-xs px-1.5 py-0.5 font-bold uppercase tracking-bib font-mono text-[9px]",
  {
    variants: {
      variant: {
        default: "bg-ink/10 text-ink",
        flash: "bg-flash text-ink",
        solid: "bg-ink text-white",
        outline: "border border-ink/40 text-ink",
        muted: "bg-bone-soft text-ink-muted",
        secondary: "bg-ink text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
