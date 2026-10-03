import { Permission } from "./auth";
import { FeatureFlagKey } from "./features";

export type NavigationGroupId =
  | "main"
  | "business"
  | "catalog"
  | "insights"
  | "operations"
  | "system";

export interface NavigationGroupMeta {
  id: NavigationGroupId;
  label: string;
  order: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  shortLabel?: string;
  iconName: string;
  href: string;
  permission: Permission | null;
  feature: FeatureFlagKey | null;
  group: NavigationGroupId;
  mobilePriority: number;
  mobile: {
    primary: boolean;
  };
  badge?: string | number;
  badgeVariant?: "default" | "accent" | "subtle";
  description: string;
  keywords?: string[];
}

export interface ResolvedNavigation {
  allAuthorized: NavigationItem[];
  desktopGroups: {
    group: NavigationGroupMeta;
    items: NavigationItem[];
  }[];
  mobilePrimary: NavigationItem[];
  mobileMoreGroups: {
    group: NavigationGroupMeta;
    items: NavigationItem[];
  }[];
  mobileMoreItems: NavigationItem[];
}
