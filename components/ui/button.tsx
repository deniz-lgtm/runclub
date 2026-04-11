import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — editorial / race-bib variants.
 *
 * `default` is the primary action: ink background, white text, uppercase,
 * wide tracking. Think of it as the "GO" button on a race clock.
 * `flash` is the orange accent button — used sparingly for the single
 * biggest action on a screen.
 * `outline` is a hairline ink border on a transparent background —
 * the default secondary action.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-bold uppercase tracking-bib transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-bone disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-ink text-white hover:bg-ink-soft active:translate-y-[1px]",
        flash:
          "bg-flash text-ink hover:bg-flash-dark hover:text-white active:translate-y-[1px]",
        secondary:
          "bg-flash text-ink hover:bg-flash-dark hover:text-white active:translate-y-[1px]",
        outline:
          "border border-ink bg-transparent text-ink hover:bg-ink hover:text-white",
        ghost: "text-ink hover:bg-ink/5 normal-case tracking-normal",
        destructive: "bg-siren text-white hover:bg-red-700",
        link: "text-ink underline underline-offset-4 hover:text-flash",
      },
      size: {
        default: "h-10 px-4 text-[11px]",
        sm: "h-8 px-3 text-[10px]",
        lg: "h-12 px-6 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
