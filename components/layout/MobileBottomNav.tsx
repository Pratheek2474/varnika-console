"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/lib/context/navigation-context";
import { NavIcon } from "@/components/ui/nav-icon";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { resolved, mobileMoreOpen, setMobileMoreOpen } = useNavigation();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  React.useEffect(() => {
    // Hide nav when composer/input gets focus (keyboard opens)
    const onFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        setKeyboardOpen(true);
      }
    };
    const onFocusOut = () => setKeyboardOpen(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Hide only when keyboard is open
  if (keyboardOpen) return null;

  const primaryItems = resolved.mobilePrimary;

  const isMoreActive = resolved.mobileMoreItems.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const moreHasBadge = resolved.mobileMoreItems.some((item) => item.badge != null);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E6E3DB] shadow-sm pb-[env(safe-area-inset-bottom)] select-none"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {primaryItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center h-full py-1 px-1 relative transition-colors",
                isActive
                  ? "text-black font-medium"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-[2px] bg-black" />
              )}

              <div className="relative">
                <NavIcon
                  name={item.iconName}
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-black" : "text-neutral-500"
                  )}
                />
                {item.badge != null && (
                  <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] font-mono flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 font-sans tracking-tight">
                {item.shortLabel || item.label}
              </span>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
          aria-expanded={mobileMoreOpen}
          aria-label="More destinations"
          className={cn(
            "flex-1 flex flex-col items-center justify-center h-full py-1 px-1 relative transition-colors",
            mobileMoreOpen || isMoreActive
              ? "text-black font-medium"
              : "text-neutral-500 hover:text-neutral-700"
          )}
        >
          {(mobileMoreOpen || isMoreActive) && (
            <div className="absolute top-0 w-8 h-[2px] bg-black" />
          )}

          <div className="relative">
            <MoreHorizontal
              className={cn(
                "w-5 h-5",
                mobileMoreOpen || isMoreActive ? "text-black" : "text-neutral-500"
              )}
            />
            {moreHasBadge && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-black" />
            )}
          </div>

          <span className="text-[11px] mt-1 font-sans tracking-tight">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
