"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { usernameFromEmail } from "@/lib/supabase/login";
import type { Session } from "@supabase/supabase-js";
import { Permission, PRESET_ROLES, RoleId, UserProfile } from "../types/auth";

interface AuthContextValue {
  user: UserProfile | null;
  role: RoleId;
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [employee, setEmployee] = useState<{
    name: string;
    app_role: string;
    avatar_url: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Track the real Supabase session (persisted automatically by supabase-js)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Resolve display name + app role from the employees directory.
  // Match by username first (username@varnika.local logins), then by email
  // for backwards compatibility. Any authenticated user without an employee
  // row defaults to staff — logins are created by the owner in the Supabase
  // dashboard, so this cannot be abused for privilege escalation.
  useEffect(() => {
    const email = session?.user?.email;
    if (!email) {
      setEmployee(null);
      return;
    }
    const username = usernameFromEmail(email);
    setProfileLoading(true);
    let query = supabase
      .from("employees")
      .select("name,app_role,avatar_url")
      .eq("is_active", true);
    query = username
      ? query.or(`username.eq.${username},email.eq.${email}`)
      : query.eq("email", email);
    query.maybeSingle().then(({ data }) => {
      setEmployee(
        (data as { name: string; app_role: string; avatar_url: string } | null) ??
          null
      );
      setProfileLoading(false);
    });
  }, [session]);

  const role: RoleId =
    employee?.app_role === "admin" ? "admin" : session ? "staff" : "staff";

  const permissions: Permission[] = session
    ? (PRESET_ROLES[role]?.permissions || [])
    : [];

  const email = session?.user?.email ?? "";
  const user: UserProfile | null = session
    ? {
        id: session.user.id,
        name: employee?.name || email.split("@")[0] || "Staff",
        email,
        avatarUrl: employee?.avatar_url || "",
        role,
      }
    : null;

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (targetPermissions: Permission[]): boolean => {
    return targetPermissions.some((p) => permissions.includes(p));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        loading: sessionLoading || profileLoading,
        hasPermission,
        hasAnyPermission,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
