"use client";

import React from "react";
import { TopNavBar } from "./TopNavBar";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMoreMenu } from "./MobileMoreMenu";
import { CommandPalette } from "./CommandPalette";
import { NavigationProgress } from "./NavigationProgress";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#141414] flex flex-col font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Instant navigation feedback (shows on link click, before route loads) */}
      <NavigationProgress />

      {/* Fixed Top Navigation Bar */}
      <TopNavBar />

      {/* Main Workspace Layout — offset by navbar height */}
      <div className="flex-1 flex w-full relative min-h-0 lg:pt-14">
        {/* Desktop Persistent Sidebar */}
        <DesktopSidebar />

        {/* Content Region */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-12">
          {/* Mobile Top Header */}
          <MobileHeader />

          {/* Page Content Container */}
          <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8 sm:py-10 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation Controls */}
      <MobileBottomNav />
      <MobileMoreMenu />

      {/* Global Command Search (⌘K) */}
      <CommandPalette />
    </div>
  );
}
