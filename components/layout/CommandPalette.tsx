"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/lib/context/navigation-context";
import { useAuth } from "@/lib/context/auth-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NavIcon } from "@/components/ui/nav-icon";
import { Search, ArrowRight } from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, resolved } = useNavigation();
  const { role, switchRole } = useAuth();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery("");
    }
  }, [commandPaletteOpen]);

  const handleSelectRoute = (href: string) => {
    setCommandPaletteOpen(false);
    router.push(href);
  };

  const q = query.toLowerCase().trim();

  const filteredNavItems = resolved.allAuthorized.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
  );

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white border border-[#E6E3DB] shadow-lg">
        {/* Search Input */}
        <div className="flex items-center px-5 py-4 border-b border-[#F0ECE1] bg-[#FAF9F6]">
          <Search className="w-4 h-4 text-neutral-500 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a module name or action (e.g. Orders, Catalog, Customers)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-black placeholder:text-neutral-500 focus:outline-none font-sans"
            autoFocus
          />
          <kbd className="text-[10px] bg-white border border-[#E6E3DB] px-1.5 py-0.5 text-neutral-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-3 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-medium text-neutral-500 px-3 pb-1">
              Modules
            </div>
            {filteredNavItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-500">
                No matching destinations found.
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectRoute(item.href)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs text-neutral-700 hover:bg-[#F7F5F0] hover:text-black transition-colors text-left group rounded-xs"
                  >
                    <div className="flex items-center gap-3">
                      <NavIcon
                        name={item.iconName}
                        className="w-4 h-4 text-neutral-500 group-hover:text-black transition-colors"
                      />
                      <div>
                        <div className="font-medium text-black">{item.label}</div>
                        <div className="text-[11px] text-neutral-500">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-black transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#F0ECE1] bg-[#FAF9F6] flex items-center justify-between text-[11px] text-neutral-500 font-sans">
          <span>Varnika Console</span>
          <span>Shortcut: ⌘B toggles sidebar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
