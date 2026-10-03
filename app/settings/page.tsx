"use client";

import React from "react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { useFeatureFlags } from "@/lib/context/feature-flags-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRESET_ROLES, RoleId } from "@/lib/types/auth";
import { Check, LogOut } from "lucide-react";

export default function SettingsPage() {
  const { role, user, signOut } = useAuth();
  const { flags, toggleFeatureFlag, resetFeatureFlags } = useFeatureFlags();

  return (
    <RouteGuard
      requiredPermission="settings.read"
      moduleName="Settings"
    >
      <div className="space-y-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Settings & Access
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Configure operator access roles and active console modules.
            </p>
          </div>
        </div>

        {/* User Profile Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-black text-white text-base font-medium flex items-center justify-center shrink-0">
                {(user?.name ?? "?").charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black truncate">{user?.name ?? "—"}</div>
                <div className="text-xs text-neutral-500 truncate">{user?.email ?? ""}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">
                Role: {role.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        {/* Role Presets */}
        <Card>
          <CardHeader>
            <CardTitle>Console Access Role</CardTitle>
            <CardDescription>
              Select an access profile to adjust permissions across all console views.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["admin", "staff"] as RoleId[]).map((rId) => {
                const roleDef = PRESET_ROLES[rId as Exclude<RoleId, "custom">];
                if (!roleDef) return null;
                const isSelected = role === rId;

                return (
                  <div
                    key={rId}
                    className={`p-4 border transition-colors rounded-xs flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-black bg-white ring-1 ring-black"
                        : "border-[#E6E3DB] bg-[#FAF9F6]"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-black">
                        {roleDef.name}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        {roleDef.description}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <div className="w-4 h-4 bg-black text-white flex items-center justify-center text-[10px] rounded-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 border border-[#E6E3DB] rounded-xs" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags / Active Modules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Active Modules</CardTitle>
              <CardDescription>
                Enable or disable console sections for your team.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFeatureFlags}
              className="text-xs"
            >
              Reset
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: "revenue" as const,
                  title: "Revenue & Financial Ledger",
                  desc: "Display settled revenues and financial summaries.",
                },
                {
                  key: "analytics" as const,
                  title: "Analytics & Trends",
                  desc: "Display conversion funnel charts and customer trends.",
                },
                {
                  key: "delivery_tracking" as const,
                  title: "Delivery & Courier Tracking",
                  desc: "Real-time courier tracking and dispatch updates.",
                },
                {
                  key: "support_tickets" as const,
                  title: "Client Queries & Tickets",
                  desc: "Client concierge inquiries and alteration tickets.",
                },
              ].map((mod) => {
                const isEnabled = flags[mod.key];
                return (
                  <div
                    key={mod.key}
                    onClick={() => toggleFeatureFlag(mod.key)}
                    className={`p-4 border cursor-pointer transition-colors rounded-xs flex items-start justify-between gap-3 ${
                      isEnabled
                        ? "border-black bg-white"
                        : "border-[#E6E3DB] bg-[#FAF9F6] opacity-60"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-black">
                        {mod.title}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {mod.desc}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 border border-[#E6E3DB] rounded-xs">
                        {isEnabled ? "ACTIVE" : "OFF"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
