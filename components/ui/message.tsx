"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "own";
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full gap-3",
          variant === "own" ? "flex-row-reverse" : "flex-row"
        )}
        {...props}
      >
        <div
          className={cn(
            "flex max-w-[70%] flex-col gap-1",
            variant === "own" ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "rounded-2xl px-4 py-2 text-sm",
              variant === "own"
                ? "bg-black text-white rounded-tr-none"
                : "bg-[#F4F2ED] text-black rounded-tl-none"
            )}
          >
            {children}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-neutral-400">
            <time dateTime={new Date().toISOString()}>
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            {variant === "own" && (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  }
);
Message.displayName = "Message";

export { Message };