"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { useNavigation } from "@/lib/context/navigation-context";
import { useActor } from "@/lib/context/actor-context";
import { Search, Menu, X } from "lucide-react";

export function TopNavBar() {
  const { user, role } = useAuth();
  const { setCommandPaletteOpen, sidebarCollapsed, toggleSidebar } = useNavigation();
  const { actor, setActor, employees } = useActor();

  return (
    <nav className="hidden lg:flex fixed top-0 left-0 right-0 h-14 bg-[#FAF9F6] border-b border-[#E6E3DB] items-center px-5 gap-3 z-40 select-none">
      {/* Left: Sidebar toggle + Brand */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sidebar collapse/expand toggle — desktop only */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center justify-center p-1.5 text-neutral-600 hover:text-black hover:bg-[#EFECE5] rounded-sm transition-colors"
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
          className="font-sans text-sm font-semibold tracking-[0.12em] text-black uppercase"
        >
          Varnika Console
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full max-w-md flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E6E3DB] hover:border-black/30 transition-all rounded-sm text-sm text-neutral-500"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Search customers, pages…</span>
          <kbd className="text-[10px] bg-[#F4F2ED] px-1.5 py-0.5 text-neutral-500 font-mono shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Acting-as + Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {employees.length > 0 && (
          <label className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="hidden xl:inline">Acting as</span>
            <select
              value={employees.some((e) => e.name === actor) ? actor : ""}
              onChange={(e) => setActor(e.target.value)}
              className="max-w-[140px] px-2 py-1.5 bg-white border border-[#E6E3DB] text-xs text-black focus:outline-none focus:border-black rounded-xs"
              title="Changes you make are recorded under this name"
            >
              {!employees.some((e) => e.name === actor) && (
                <option value="">{actor}</option>
              )}
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-medium text-black leading-tight">{user.name}</div>
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">{role}</div>
        </div>
        <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center shrink-0">
          {user.name.charAt(0)}
        </div>
      </div>
    </nav>
  );
}
