"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { useFeatureFlags } from "@/lib/context/feature-flags-context";
import { Permission } from "@/lib/types/auth";
import { FeatureFlagKey } from "@/lib/types/features";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredFeature?: FeatureFlagKey;
  moduleName?: string;
}

export function RouteGuard({
  children,
  requiredPermission,
  requiredFeature,
  moduleName = "This Section",
}: RouteGuardProps) {
  const { hasPermission, role, switchRole } = useAuth();
  const { isFeatureEnabled, toggleFeatureFlag } = useFeatureFlags();

  // Feature Flag check
  if (requiredFeature && !isFeatureEnabled(requiredFeature)) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E6E3DB] p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#F7F5F0] border border-[#E6E3DB] flex items-center justify-center text-neutral-600">
            <Lock className="w-5 h-5" />
          </div>

          <h2 className="font-sans text-lg font-medium text-black mb-1">
            {moduleName} Inactive
          </h2>

          <p className="text-xs text-neutral-600 font-sans leading-relaxed mb-6">
            This module is currently disabled in your console configuration.
          </p>

          <div className="flex gap-2 justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={() => toggleFeatureFlag(requiredFeature)}
            >
              Enable Module
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Back to Overview</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E6E3DB] p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-[#F7F5F0] border border-[#E6E3DB] flex items-center justify-center text-neutral-600">
            <Lock className="w-5 h-5" />
          </div>

          <h2 className="font-sans text-lg font-medium text-black mb-1">
            Access Restricted
          </h2>

          <p className="text-xs text-neutral-600 font-sans leading-relaxed mb-6">
            Your current account permissions do not include access to {moduleName}.
          </p>

          <div className="flex gap-2 justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={() => switchRole("admin")}
            >
              Switch to Administrator
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Back to Overview</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
