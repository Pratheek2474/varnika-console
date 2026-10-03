"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/lib/context/navigation-context";
import { useAuth } from "@/lib/context/auth-context";
import { NavIcon } from "@/components/ui/nav-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { resolved, sidebarCollapsed } = useNavigation();
  const { user, role, switchRole } = useAuth();

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-[#E6E3DB] bg-[#F7F5F0] text-[#141414] transition-all duration-200 ease-out relative select-none z-30 shrink-0",
          sidebarCollapsed ? "w-[64px]" : "w-[240px]"
        )}
      >


        {/* Navigation Groups */}
        <div className={cn("flex-1 overflow-y-auto px-2 space-y-6", sidebarCollapsed ? "py-4" : "py-3")}>
          {resolved.desktopGroups.map(({ group, items }) => (
            <div key={group.id} className="space-y-0.5">
              {!sidebarCollapsed ? (
                <div className="px-3 pb-1.5 text-[10px] uppercase tracking-[0.14em] font-medium text-neutral-500 font-sans">
                  {group.label}
                </div>
              ) : (
                <div className="w-6 mx-auto border-t border-[#E6E3DB] my-1" />
              )}

              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  const content = (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-xs font-normal transition-all rounded-sm group relative",
                        isActive
                          ? "bg-black text-white font-medium"
                          : "text-neutral-600 hover:text-black hover:bg-[#EFECE5]",
                        sidebarCollapsed && "justify-center px-0 py-2"
                      )}
                    >
                      <NavIcon
                        name={item.iconName}
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-white"
                            : "text-neutral-500 group-hover:text-black"
                        )}
                      />

                      {!sidebarCollapsed && (
                        <>
                          <span className="truncate flex-1 tracking-tight">
                            {item.label}
                          </span>

                          {item.badge && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 font-mono shrink-0 rounded-xs",
                                isActive
                                  ? "bg-neutral-800 text-neutral-200"
                                  : "bg-[#EAE6DD] text-neutral-600"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return content;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: User Profile */}
        <div className="border-t border-[#E6E3DB] p-3 bg-[#F2EFE8]">
          {sidebarCollapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-medium flex items-center justify-center shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-black truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-neutral-600 uppercase tracking-wider font-mono">
                    {role}
                  </div>
                </div>
              </div>

              <button
                onClick={() => switchRole(role === "admin" ? "worker" : "admin")}
                title="Toggle Admin / Worker role"
                className="text-[10px] px-2 py-0.5 border border-[#D5D0C4] bg-white text-neutral-700 hover:border-black rounded-xs transition-colors"
              >
                {role === "admin" ? "Admin" : "Worker"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
