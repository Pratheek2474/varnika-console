"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { TopNavBar } from "./TopNavBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { CommandPalette } from "./CommandPalette";
import { NavigationProgress } from "./NavigationProgress";
import { Toaster } from "sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Login is a standalone screen — just the login box, no nav/sidebar chrome.
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#141414] flex flex-col font-sans antialiased selection:bg-neutral-900 selection:text-white">
        <main className="flex-1 flex flex-col w-full mx-auto">
          {children}
        </main>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#FAF9F6] text-[#141414] flex flex-col font-sans antialiased selection:bg-neutral-900 selection:text-white overflow-hidden">
      {/* Instant navigation feedback (shows on link click, before route loads) */}
      <NavigationProgress />

      {/* Fixed Top Navigation Bar */}
      <TopNavBar />

      {/* Main Workspace Layout — offset by navbar height */}
      <div className="flex-1 flex w-full relative min-h-0 lg:pt-14 overflow-hidden">
        {/* Desktop Persistent Sidebar */}
        <DesktopSidebar />

        {/* Content Region */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Top Header */}
          <MobileHeader />

          {/* Page Content Container */}
          <main className={pathname.startsWith("/chat") ? "flex-1 w-full mx-auto overflow-hidden" : "flex-1 px-5 sm:px-8 lg:px-12 py-8 sm:py-10 max-w-7xl w-full mx-auto"}>
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Controls */}
      <MobileBottomNav />
      <MobileMoreMenu />

      {/* Global Command Search (⌘K) */}
      <CommandPalette />

      {/* Toast notifications (drag-and-drop errors, etc.) */}
      <Toaster position="bottom-right" />
    </div>
  );
}
