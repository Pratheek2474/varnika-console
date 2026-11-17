"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";

export function MobileHeader() {
  const { role } = useAuth();

  return (
    <header className="lg:hidden h-14 bg-ivory/95 backdrop-blur-md border-b border-line px-4 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Role Pill */}
      <span
        className="px-2 py-0.5 border border-line bg-white text-[10px] uppercase font-mono tracking-wider text-neutral-600"
        title="Console role"
      >
        {role}
      </span>

      {/* Center: Brand Name */}
      <Link href="/" className="flex items-center">
        <img src="/brand/varnika-wordmark.png" alt="Varnika" className="h-4 w-auto" />
      </Link>

      {/* Right: spacer keeps the logo centred */}
      <span className="w-[52px]" aria-hidden />
    </header>
  );
}
