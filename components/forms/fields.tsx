import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-[11px] font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full px-2.5 py-1.5 bg-white border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs";

export const selectCls =
  "w-full px-2.5 py-1.5 bg-white border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs";
