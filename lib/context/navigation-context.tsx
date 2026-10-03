"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveNavigation } from "../navigation/resolver";
import { NavigationItem, ResolvedNavigation } from "../types/navigation";
import { useAuth } from "./auth-context";
import { useFeatureFlags } from "./feature-flags-context";
import { getNavCounts } from "../supabase/stats";

interface NavigationContextValue {
  resolved: ResolvedNavigation;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  mobileMoreOpen: boolean;
  setMobileMoreOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  quickSearchQuery: string;
  setQuickSearchQuery: (query: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { permissions, user } = useAuth();
  const { flags } = useFeatureFlags();

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>("");
  // Live badge text per nav item id. Null = still loading (badges hidden
  // until then so a stale hardcoded number is never shown).
  const [liveBadges, setLiveBadges] = useState<Record<string, string> | null>(null);

  // Persist sidebar collapsed preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("varnika_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsedState(saved === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem("varnika_sidebar_collapsed", String(collapsed));
    } catch {
      // Ignore
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Keyboard shortcut for Command Palette: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsedState((prev) => {
          const next = !prev;
          try {
            localStorage.setItem("varnika_sidebar_collapsed", String(next));
          } catch {}
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live nav badges — fetched once per session after sign-in.
  useEffect(() => {
    if (!user) {
      setLiveBadges(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const counts = await getNavCounts();
        if (cancelled) return;
        const badges: Record<string, string> = {};
        if (counts.ordersActive !== null && counts.ordersActive > 0) {
          badges.orders = String(counts.ordersActive);
        }
        if (counts.inTransit !== null && counts.inTransit > 0) {
          badges.delivery = `${counts.inTransit} In-Transit`;
        }
        if (counts.revenueDelta !== null) {
          badges.revenue = counts.revenueDelta;
        }
        if (counts.chats !== null && counts.chats > 0) {
          badges.chat = String(counts.chats);
        }
        setLiveBadges(badges);
      } catch {
        if (!cancelled) setLiveBadges({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Purely resolve navigation reactively whenever permissions or flags change
  const resolved = useMemo(() => {
    const base = resolveNavigation({
      permissions,
      featureFlags: flags,
      maxMobilePrimary: 4,
    });
    // Override static config badges with live counts (strip while loading).
    const apply = (item: NavigationItem): NavigationItem => {
      const { badge: _static, badgeVariant, ...rest } = item;
      const live = liveBadges?.[item.id];
      return live === undefined ? rest : { ...rest, badge: live, badgeVariant };
    };
    return {
      allAuthorized: base.allAuthorized.map(apply),
      desktopGroups: base.desktopGroups.map(({ group, items }) => ({
        group,
        items: items.map(apply),
      })),
      mobilePrimary: base.mobilePrimary.map(apply),
      mobileMoreGroups: base.mobileMoreGroups.map(({ group, items }) => ({
        group,
        items: items.map(apply),
      })),
      mobileMoreItems: base.mobileMoreItems.map(apply),
    };
  }, [permissions, flags, liveBadges]);

  return (
    <NavigationContext.Provider
      value={{
        resolved,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        mobileMoreOpen,
        setMobileMoreOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        quickSearchQuery,
        setQuickSearchQuery,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
