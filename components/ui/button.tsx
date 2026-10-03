import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-40 select-none rounded-xs",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white hover:bg-neutral-800 active:scale-[0.99]",
        secondary:
          "bg-[#F4F2ED] text-black hover:bg-[#EAE6DD] active:scale-[0.99]",
        outline:
          "border border-[#E6E3DB] bg-white text-black hover:bg-[#FAF9F6] active:scale-[0.99]",
        ghost:
          "text-neutral-600 hover:text-black hover:bg-[#F4F2ED]",
        destructive:
          "bg-neutral-900 text-white hover:bg-black",
        link:
          "text-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-sm",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
