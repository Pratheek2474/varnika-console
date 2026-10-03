"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "own";
  senderName?: string;
  timestamp?: string;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, variant = "default", senderName, timestamp, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full",
          variant === "own" ? "justify-end" : "justify-start"
        )}
        {...props}
      >
        <div className={cn("flex max-w-[75%] flex-col gap-0.5", variant === "own" ? "items-end" : "items-start")}>
          {senderName && (
            <div className={cn("text-[11px] font-medium", variant === "own" ? "text-neutral-500" : "text-neutral-600")}>
              {senderName}
            </div>
          )}
          <div
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm leading-relaxed",
              variant === "own"
                ? "bg-black text-white rounded-br-sm"
                : "bg-[#F4F2ED] text-black rounded-bl-sm border border-[#E6E3DB]"
            )}
          >
            {children}
          </div>
          {timestamp && (
            <time className="text-[10px] text-neutral-400 font-mono mt-0.5">
              {timestamp}
            </time>
          )}
        </div>
      </div>
    );
  }
);
Message.displayName = "Message";

export { Message };