"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { EmployeeRow } from "@/lib/supabase/database.types";
import { listEmployees } from "@/lib/supabase/queries-employees";

interface ActorContextValue {
  /** Display name stamped on every change ("updated by"). */
  actor: string;
  setActor: (name: string) => void;
  employees: EmployeeRow[];
  refreshEmployees: () => Promise<void>;
}

const ActorContext = createContext<ActorContextValue | undefined>(undefined);

const STORAGE_KEY = "varnika_actor";

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActorState] = useState<string>("Admin");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  const refreshEmployees = useCallback(async () => {
    try {
      const rows = await listEmployees();
      setEmployees(rows.filter((e) => e.is_active));
      // If the saved actor no longer exists, fall back gracefully
      setActorState((prev) => {
        if (prev === "Admin") {
          const hasAdmin = rows.some((e) => e.is_active && e.name === "Admin");
          if (hasAdmin) return "Admin";
          return rows.find((e) => e.is_active)?.name ?? "Admin";
        }
        return rows.some((e) => e.is_active && e.name === prev)
          ? prev
          : (rows.find((e) => e.is_active)?.name ?? "Admin");
      });
    } catch {
      // Table may not exist yet / offline — keep default actor
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActorState(saved);
    } catch {
      // Ignore
    }
    refreshEmployees();
  }, [refreshEmployees]);

  const setActor = (name: string) => {
    setActorState(name);
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Ignore
    }
  };

  return (
    <ActorContext.Provider
      value={{ actor, setActor, employees, refreshEmployees }}
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
