export type FeatureFlagKey =
  | "revenue"
  | "analytics"
  | "catalog"
  | "orders_kanban"
  | "advanced_inventory"
  | "marketing"
  | "delivery_tracking"
  | "support_tickets"
  | "measurements"
  | "reports";

export interface FeatureFlagMeta {
  key: FeatureFlagKey;
  label: string;
  description: string;
  defaultValue: boolean;
  category: "core" | "insights" | "operations" | "experimental";
}

export type FeatureFlagsMap = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsMap = {
  revenue: true,
  analytics: true,
  catalog: true,
  orders_kanban: true,
  advanced_inventory: true,
  marketing: false, // experimental
  delivery_tracking: true,
  support_tickets: true,
  measurements: true,
  reports: true,
};

export const FEATURE_FLAGS_METADATA: FeatureFlagMeta[] = [
  {
    key: "revenue",
    label: "Revenue Module",
    description: "Financial breakdown, revenue trajectory, and category sales attribution",
    defaultValue: true,
    category: "insights",
  },
  {
    key: "analytics",
    label: "Advanced Analytics",
    description: "Cohort retention, customer acquisition channels, and conversion charts",
    defaultValue: true,
    category: "insights",
  },
  {
    key: "catalog",
    label: "Luxury Catalog",
    description: "Collection management, product grids, lookbooks, and SKU details",
    defaultValue: true,
    category: "core",
  },
  {
    key: "orders_kanban",
    label: "Kanban & Ticket View",
    description: "Multi-stage pipeline board and ticket interface for order fulfillment",
    defaultValue: true,
    category: "operations",
  },
  {
    key: "advanced_inventory",
    label: "Real-time Inventory Tracking",
    description: "Warehouse stock levels, low-stock alerts, and restocking indicators",
    defaultValue: true,
    category: "operations",
  },
  {
    key: "delivery_tracking",
    label: "Shipment & Delivery Tracking",
    description: "Courier integration tracking (DHL, FedEx, BlueDart) with live parcel status",
    defaultValue: true,
    category: "operations",
  },
  {
    key: "support_tickets",
    label: "Customer Queries & Support Tickets",
    description: "Ticket management system for bespoke inquiries and after-sales support",
    defaultValue: true,
    category: "operations",
  },
  {
    key: "measurements",
    label: "Bespoke Measurements",
    description: "High-fashion custom tailoring measurement profiles for client body specs",
    defaultValue: true,
    category: "core",
  },
  {
    key: "reports",
    label: "Executive Reports",
    description: "Downloadable PDF and CSV financial reconciliation reports",
    defaultValue: true,
    category: "insights",
  },
  {
    key: "marketing",
    label: "Campaign Marketing",
    description: "Email broadcasts, seasonal lookbook blasts, and VIP invitations",
    defaultValue: false,
    category: "experimental",
  },
];
