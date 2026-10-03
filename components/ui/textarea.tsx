import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full border border-[#E6E3DB] bg-white px-3 py-2 text-xs placeholder:text-neutral-400 focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50 transition-colors rounded-xs",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
