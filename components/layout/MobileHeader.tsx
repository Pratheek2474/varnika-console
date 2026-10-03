"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { useNavigation } from "@/lib/context/navigation-context";
import { Search } from "lucide-react";

export function MobileHeader() {
  const { role } = useAuth();
  const { setCommandPaletteOpen } = useNavigation();

  return (
    <header className="lg:hidden h-14 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E6E3DB] px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Role Pill */}
      <span
        className="px-2 py-0.5 border border-[#E6E3DB] bg-white text-[10px] uppercase font-mono tracking-wider text-neutral-600"
        title="Console role"
      >
        {role}
      </span>

      {/* Center: Brand Name */}
      <Link href="/" className="font-sans text-sm tracking-[0.14em] font-semibold text-black uppercase">
        Varnika Console
      </Link>

      {/* Right: Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="p-2 text-neutral-700 hover:text-black active:scale-95 transition-transform"
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
      </button>
    </header>
  );
}
