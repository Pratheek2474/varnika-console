"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Permission, PRESET_ROLES, RoleId, UserProfile } from "../types/auth";

interface AuthContextValue {
  user: UserProfile;
  role: RoleId;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  switchRole: (role: RoleId) => void;
  setCustomPermissions: (perms: Permission[]) => void;
  toggleCustomPermission: (perm: Permission) => void;
}

const DEFAULT_USER: UserProfile = {
  id: "usr_admin_01",
  name: "Varnika K.",
  email: "director@varnika.luxury",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
  role: "admin",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<RoleId>("admin");
  const [customPermissions, setCustomPermissionsState] = useState<Permission[]>(
    PRESET_ROLES.admin.permissions
  );

  // Load saved role preference on client mount
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem("varnika_admin_role") as RoleId;
      if (savedRole && (savedRole in PRESET_ROLES || savedRole === "custom")) {
        setRole(savedRole);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const switchRole = (newRole: RoleId) => {
    setRole(newRole);
    try {
      localStorage.setItem("varnika_admin_role", newRole);
    } catch {
      // Ignore
    }
  };

  const permissions: Permission[] =
    role === "custom"
      ? customPermissions
      : PRESET_ROLES[role]?.permissions || [];

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (targetPermissions: Permission[]): boolean => {
    return targetPermissions.some((p) => permissions.includes(p));
  };

  const setCustomPermissions = (perms: Permission[]) => {
    setCustomPermissionsState(perms);
    setRole("custom");
  };

  const toggleCustomPermission = (perm: Permission) => {
    setCustomPermissionsState((prev) => {
      const next = prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm];
      return next;
    });
    setRole("custom");
  };

  const user: UserProfile = {
    ...DEFAULT_USER,
    role,
    customPermissions: role === "custom" ? customPermissions : undefined,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        hasPermission,
        hasAnyPermission,
        switchRole,
        setCustomPermissions,
        toggleCustomPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
