"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "@/lib/context/auth-context";
import { FeatureFlagsProvider } from "@/lib/context/feature-flags-context";
import { NavigationProvider } from "@/lib/context/navigation-context";
import { ActorProvider } from "@/lib/context/actor-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Register Service Worker on non-desktop devices / mobile browsers
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isMobileOrTablet =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 1024;

      if (isMobileOrTablet) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Varnika Service Worker registered successfully:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration skipped or failed:", err);
          });
      }
    }
  }, []);

  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <NavigationProvider>
          <ActorProvider>{children}</ActorProvider>
        </NavigationProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}
