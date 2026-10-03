"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_FEATURE_FLAGS, FeatureFlagKey, FeatureFlagsMap } from "../types/features";

interface FeatureFlagsContextValue {
  flags: FeatureFlagsMap;
  isFeatureEnabled: (key: FeatureFlagKey) => boolean;
  toggleFeatureFlag: (key: FeatureFlagKey) => void;
  setFeatureFlag: (key: FeatureFlagKey, enabled: boolean) => void;
  resetFeatureFlags: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlagsMap>(DEFAULT_FEATURE_FLAGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("varnika_feature_flags");
      if (saved) {
        setFlags((prev) => ({
          ...prev,
          ...JSON.parse(saved),
        }));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveFlags = (updated: FeatureFlagsMap) => {
    setFlags(updated);
    try {
      localStorage.setItem("varnika_feature_flags", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const isFeatureEnabled = (key: FeatureFlagKey): boolean => {
    return Boolean(flags[key]);
  };

  const toggleFeatureFlag = (key: FeatureFlagKey) => {
    const next = {
      ...flags,
      [key]: !flags[key],
    };
    saveFlags(next);
  };

  const setFeatureFlag = (key: FeatureFlagKey, enabled: boolean) => {
    const next = {
      ...flags,
      [key]: enabled,
    };
    saveFlags(next);
  };

  const resetFeatureFlags = () => {
    saveFlags(DEFAULT_FEATURE_FLAGS);
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        isFeatureEnabled,
        toggleFeatureFlag,
        setFeatureFlag,
        resetFeatureFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider");
  }
  return context;
}
