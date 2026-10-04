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

/**
 * Blank-by-default numeric input: plain text field with a numeric keypad on
 * mobile, no spinner arrows, backspace always works. Holds a string; parse
 * with Number() on save (empty string → 0 via `Number(v) || 0`).
 */
export function NumberField({
  value,
  onChange,
  placeholder,
  allowDecimals = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  allowDecimals?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode={allowDecimals ? "decimal" : "numeric"}
      autoComplete="off"
      className={inputCls}
      value={value}
      placeholder={placeholder}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || (allowDecimals ? /^\d*\.?\d*$/.test(v) : /^\d*$/.test(v))) {
          onChange(v);
        }
      }}
    />
  );
}
