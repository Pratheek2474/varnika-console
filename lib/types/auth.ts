export type Permission =
  | "home.read"
  | "orders.read"
  | "orders.write"
  | "revenue.read"
  | "catalog.read"
  | "catalog.write"
  | "customers.read"
  | "customers.write"
  | "measurements.read"
  | "measurements.write"
  | "delivery.read"
  | "delivery.write"
  | "tickets.read"
  | "tickets.write"
  | "analytics.read"
  | "reports.read"
  | "transactions.read"
  | "transactions.write"
  | "marketing.read"
  | "settings.read"
  | "settings.write"
  | "feature_flags.manage";

export type RoleId = "admin" | "worker" | "manager" | "custom";

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: RoleId;
  customPermissions?: Permission[];
}

export const PRESET_ROLES: Record<Exclude<RoleId, "custom">, RoleDefinition> = {
  admin: {
    id: "admin",
    name: "Business Administrator",
    description: "Unrestricted access to all modules, financial data, and configurations",
    permissions: [
      "home.read",
      "orders.read",
      "orders.write",
      "revenue.read",
      "catalog.read",
      "catalog.write",
      "customers.read",
      "customers.write",
      "measurements.read",
      "measurements.write",
      "delivery.read",
      "delivery.write",
      "tickets.read",
      "tickets.write",
      "analytics.read",
      "reports.read",
      "transactions.read",
      "transactions.write",
      "marketing.read",
      "settings.read",
      "settings.write",
      "feature_flags.manage",
    ],
  },
  worker: {
    id: "worker",
    name: "Operations Associate",
    description: "Operational floor access: orders, catalog items, shipments, and customer measurements",
    permissions: [
      "home.read",
      "orders.read",
      "orders.write",
      "catalog.read",
      "delivery.read",
      "measurements.read",
      "tickets.read",
      "transactions.read",
    ],
  },
  manager: {
    id: "manager",
    name: "Floor Manager",
    description: "Manage day-to-day catalog, staff, orders, customer profiles without system settings",
    permissions: [
      "home.read",
      "orders.read",
      "orders.write",
      "catalog.read",
      "catalog.write",
      "customers.read",
      "customers.write",
      "measurements.read",
      "measurements.write",
      "delivery.read",
      "delivery.write",
      "tickets.read",
      "tickets.write",
      "analytics.read",
      "transactions.read",
      "transactions.write",
    ],
  },
};
