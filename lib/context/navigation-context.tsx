"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveNavigation } from "../navigation/resolver";
import { ResolvedNavigation } from "../types/navigation";
import { useAuth } from "./auth-context";
import { useFeatureFlags } from "./feature-flags-context";

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
  const { permissions } = useAuth();
  const { flags } = useFeatureFlags();

  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>("");

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

  // Purely resolve navigation reactively whenever permissions or flags change
  const resolved = useMemo(() => {
    return resolveNavigation({
      permissions,
      featureFlags: flags,
      maxMobilePrimary: 4,
    });
  }, [permissions, flags]);

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
