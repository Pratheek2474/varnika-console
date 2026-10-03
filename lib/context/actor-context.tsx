"use client";

import React, { createContext, useContext } from "react";
import { useAuth } from "./auth-context";

interface ActorContextValue {
  /** Display name stamped on every change ("updated by") — the signed-in user. */
  actor: string;
  /** Kept for compatibility; the actor is derived from auth, nothing to refresh. */
  refreshEmployees: () => Promise<void>;
}

const ActorContext = createContext<ActorContextValue | undefined>(undefined);

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <ActorContext.Provider
      value={{ actor: user?.name ?? "System", refreshEmployees: async () => {} }}
    >
      {children}
    </ActorContext.Provider>
  );
}

export function useActor() {
  const context = useContext(ActorContext);
  if (!context) throw new Error("useActor must be used within ActorProvider");
  return context;
}
