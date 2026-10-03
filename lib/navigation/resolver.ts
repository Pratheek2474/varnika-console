import { MASTER_NAVIGATION, NAVIGATION_GROUPS } from "../config/navigation";
import { Permission } from "../types/auth";
import { FeatureFlagsMap } from "../types/features";
import { NavigationGroupMeta, NavigationItem, ResolvedNavigation } from "../types/navigation";

export interface ResolveNavigationOptions {
  items?: NavigationItem[];
  permissions: Permission[];
  featureFlags: FeatureFlagsMap;
  maxMobilePrimary?: number;
}

/**
 * Pure, centralized function to resolve accessible navigation
 * based on RBAC permissions and active Feature Flags.
 */
export function resolveNavigation({
  items = MASTER_NAVIGATION,
  permissions,
  featureFlags,
  maxMobilePrimary = 4,
}: ResolveNavigationOptions): ResolvedNavigation {
  // 1. Filter items by RBAC and Feature Flags independently
  const allAuthorized = items.filter((item) => {
    // RBAC check
    if (item.permission !== null && !permissions.includes(item.permission)) {
      return false;
    }

    // Feature Flag check
    if (item.feature !== null && !Boolean(featureFlags[item.feature])) {
      return false;
    }

    return true;
  });

  // 2. Group items for Desktop Persistent Sidebar
  const desktopGroupsMap = new Map<string, NavigationItem[]>();
  for (const item of allAuthorized) {
    const list = desktopGroupsMap.get(item.group) || [];
    list.push(item);
    desktopGroupsMap.set(item.group, list);
  }

  const desktopGroups = Array.from(desktopGroupsMap.entries())
    .map(([groupId, groupItems]) => ({
      group: NAVIGATION_GROUPS[groupId] || {
        id: groupId as any,
        label: groupId.toUpperCase(),
        order: 99,
      },
      items: groupItems,
    }))
    .sort((a, b) => a.group.order - b.group.order);

  // 3. Resolve Mobile Primary items (Bottom Nav)
  // Sort all authorized items by mobilePriority
  const sortedForMobile = [...allAuthorized].sort(
    (a, b) => a.mobilePriority - b.mobilePriority
  );

  // Take explicit primary candidates first, capped at maxMobilePrimary
  const explicitPrimary = sortedForMobile.filter((item) => item.mobile.primary);
  let mobilePrimary = explicitPrimary.slice(0, maxMobilePrimary);

  // If we have fewer than 3 primary items, fill with next highest priority items
  if (mobilePrimary.length < 3 && sortedForMobile.length > mobilePrimary.length) {
    const primaryIds = new Set(mobilePrimary.map((i) => i.id));
    for (const item of sortedForMobile) {
      if (!primaryIds.has(item.id)) {
        mobilePrimary.push(item);
        primaryIds.add(item.id);
        if (mobilePrimary.length >= 3) break;
      }
    }
  }

  // 4. Resolve Mobile More Menu (all authorized items NOT in mobile primary)
  const mobilePrimaryIds = new Set(mobilePrimary.map((item) => item.id));
  const mobileMoreItems = allAuthorized.filter((item) => !mobilePrimaryIds.has(item.id));

  const mobileMoreGroupsMap = new Map<string, NavigationItem[]>();
  for (const item of mobileMoreItems) {
    const list = mobileMoreGroupsMap.get(item.group) || [];
    list.push(item);
    mobileMoreGroupsMap.set(item.group, list);
  }

  const mobileMoreGroups = Array.from(mobileMoreGroupsMap.entries())
    .map(([groupId, groupItems]) => ({
      group: NAVIGATION_GROUPS[groupId] || {
        id: groupId as any,
        label: groupId.toUpperCase(),
        order: 99,
      },
      items: groupItems,
    }))
    .sort((a, b) => a.group.order - b.group.order);

  return {
    allAuthorized,
    desktopGroups,
    mobilePrimary,
    mobileMoreGroups,
    mobileMoreItems,
  };
}

/**
 * Check if a specific route/permission/feature is accessible
 */
export function canAccessRoute(
  href: string,
  permissions: Permission[],
  featureFlags: FeatureFlagsMap
): { allowed: boolean; reason?: "permission_denied" | "feature_disabled" | "not_found"; item?: NavigationItem } {
  const item = MASTER_NAVIGATION.find(
    (n) => n.href === href || (href !== "/" && n.href.startsWith(href))
  );

  if (!item) {
    return { allowed: true }; // Unmapped route defaults to allowed
  }

  if (item.permission !== null && !permissions.includes(item.permission)) {
    return { allowed: false, reason: "permission_denied", item };
  }

  if (item.feature !== null && !Boolean(featureFlags[item.feature])) {
    return { allowed: false, reason: "feature_disabled", item };
  }

  return { allowed: true, item };
}
