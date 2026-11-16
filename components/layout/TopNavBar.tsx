"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { useNavigation } from "@/lib/context/navigation-context";
import { useActor } from "@/lib/context/actor-context";
import { Search, Menu, X, LogOut } from "lucide-react";

export function TopNavBar() {
  const { user, role, signOut } = useAuth();
  const { setCommandPaletteOpen, sidebarCollapsed, toggleSidebar } = useNavigation();
  const { actor } = useActor();

  return (
    <nav className="hidden lg:flex fixed top-0 left-0 right-0 h-14 bg-ivory border-b border-line items-center px-5 gap-3 z-40 select-none">
      {/* Left: Sidebar toggle + Brand */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sidebar collapse/expand toggle — desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center p-1.5 text-neutral-600 hover:text-black hover:bg-sunk rounded-sm transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>

        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <img src="/brand/varnika-wordmark.png" alt="Varnika" className="h-[18px] w-auto" />
          <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-gold">Console</span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full max-w-md flex items-center gap-2 px-3 py-1.5 bg-white border border-line hover:border-wine/30 transition-all rounded-sm text-sm text-neutral-500"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Search customers, pages…</span>
          <kbd className="text-[10px] bg-sunk px-1.5 py-0.5 text-neutral-500 font-mono shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Profile + Sign out */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-black leading-tight">{user?.name ?? "—"}</div>
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">{role}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-wine text-white text-xs font-medium flex items-center justify-center shrink-0">
          {(user?.name ?? "?").charAt(0)}
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="p-1.5 text-neutral-500 hover:text-black hover:bg-sunk rounded-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
