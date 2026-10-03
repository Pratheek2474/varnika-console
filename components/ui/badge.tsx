import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-normal transition-colors border rounded-xs font-sans",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-black text-white",
        secondary:
          "border-[#E6E3DB] bg-[#F7F5F0] text-neutral-800",
        outline:
          "border-[#E6E3DB] bg-white text-neutral-700",
        muted:
          "border-transparent bg-[#ECE9E2] text-neutral-600",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
