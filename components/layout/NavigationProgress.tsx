"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Instant navigation feedback.
 * Shows a top progress bar in the same frame as a link click —
 * before the router even starts fetching, so cold (dev-compile)
 * navigations never feel dead. Completes + hides on route change.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const firstRender = useRef(true);
  const failSafe = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Complete + hide whenever the route actually changes (skip initial mount)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setWidth(100);
    const t = setTimeout(() => {
      setActive(false);
      setWidth(0);
    }, 250);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const anchor = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Ignore external, new-tab, download, hash-only, and modified clicks
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      setActive(true);
      setWidth(0);
      // Double rAF so the 0 → 75 transition animates instead of jumping
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setWidth(75))
      );
      if (failSafe.current) clearTimeout(failSafe.current);
      failSafe.current = setTimeout(() => {
        setActive(false);
        setWidth(0);
      }, 8000);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (failSafe.current) clearTimeout(failSafe.current);
    };
  }, []);

  if (!active && width === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none">
      <div
        className="h-full bg-black"
        style={{
          width: `${width}%`,
          opacity: active || width === 100 ? 1 : 0,
          transition:
            width === 100
              ? "width 150ms ease-out, opacity 200ms ease-out"
              : width === 0
                ? "opacity 200ms ease-out"
                : "width 1200ms ease-out",
        }}
      />
    </div>
  );
}
