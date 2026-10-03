"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/lib/context/navigation-context";
import { useAuth } from "@/lib/context/auth-context";
import { NavIcon } from "@/components/ui/nav-icon";
import { X, Search, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileMoreMenu() {
  const pathname = usePathname();
  const { resolved, mobileMoreOpen, setMobileMoreOpen } = useNavigation();
  const { user, role, signOut } = useAuth();
  const [searchFilter, setSearchFilter] = useState("");

  const filteredGroups = useMemo(() => {
    if (!searchFilter.trim()) {
      return resolved.mobileMoreGroups;
    }
    const query = searchFilter.toLowerCase();
    return resolved.mobileMoreGroups
      .map(({ group, items }) => ({
        group,
        items: items.filter(
          (i) =>
            i.label.toLowerCase().includes(query) ||
            i.description.toLowerCase().includes(query)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [resolved.mobileMoreGroups, searchFilter]);

  if (!mobileMoreOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="flex-1 w-full"
        onClick={() => setMobileMoreOpen(false)}
        aria-hidden="true"
      />

      <div className="w-full bg-[#FFFFFF] max-h-[80vh] flex flex-col border-t border-[#E6E3DB] shadow-xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="py-4 px-6 flex items-center justify-between border-b border-[#F0ECE1]">
          <span className="font-sans text-sm font-semibold tracking-wide uppercase text-black">
            Navigation Menu
          </span>
          <button
            onClick={() => setMobileMoreOpen(false)}
            className="p-1 text-neutral-500 hover:text-black transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F7F5F0] border border-[#E6E3DB] text-xs font-sans text-black placeholder:text-neutral-500 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">
              No matching destinations found.
            </div>
          ) : (
            filteredGroups.map(({ group, items }) => (
              <div key={group.id} className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-[0.14em] font-medium text-neutral-500 pb-1">
                  {group.label}
                </div>

                <div className="divide-y divide-[#F0ECE1] border border-[#E6E3DB] bg-[#FAF9F6]">
                  {items.map((item) => {
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileMoreOpen(false)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 min-h-[52px] transition-colors",
                          isActive ? "bg-white font-medium text-black" : "text-neutral-700 hover:text-black hover:bg-white"
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <NavIcon name={item.iconName} className="w-4 h-4 text-neutral-600" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-black">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-neutral-300" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div className="pt-4 pb-6 text-center space-y-3">
            <div className="text-xs text-neutral-500 font-sans">
              Logged in as <span className="text-black font-medium">{user?.name ?? "—"}</span> ({role.toUpperCase()})
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6E3DB] text-xs text-neutral-600 rounded-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
