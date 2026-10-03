import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface TimelineItemData {
  title: string;
  description?: string;
  timestamp?: string;
  state?: "completed" | "current" | "upcoming";
}

interface TimelineProps {
  items: TimelineItemData[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const state = item.state || "completed";

        return (
          <div key={idx} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[7px] top-5 bottom-0 w-px bg-[#E6E3DB]" />
            )}

            {/* Dot */}
            <div className="relative z-10 mt-0.5 shrink-0">
              {state === "completed" && (
                <div className="w-4 h-4 rounded-full bg-black flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
              {state === "current" && (
                <div className="w-4 h-4 rounded-full border-2 border-black bg-white" />
              )}
              {state === "upcoming" && (
                <div className="w-4 h-4 rounded-full border border-[#E6E3DB] bg-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    state === "upcoming" ? "text-neutral-400" : "text-black"
                  )}
                >
                  {item.title}
                </span>
                {item.timestamp && (
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                    {item.timestamp}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
