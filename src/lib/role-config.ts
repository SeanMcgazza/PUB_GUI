// Role-based feature gating configuration
// Defines navigation visibility, label overrides, and feature flags per role

export type UserRole = 'salon_owner' | 'independent_stylist' | 'salon_manager' | 'chair_renter';

export const DEFAULT_ROLE: UserRole = 'salon_owner';

export function resolveRole(role: string | null | undefined): UserRole {
  const validRoles: UserRole[] = ['salon_owner', 'independent_stylist', 'salon_manager', 'chair_renter'];
  if (role && validRoles.includes(role as UserRole)) return role as UserRole;
  return DEFAULT_ROLE;
}

// --- Navigation ---

// Nav item keys that correspond to sidebar entries
export type NavKey = 'dashboard' | 'calendar' | 'bookings' | 'clients' | 'services' | 'staff' | 'settings';

// Which nav items each role can see
const navVisibility: Record<UserRole, NavKey[]> = {
  salon_owner:        ['dashboard', 'calendar', 'bookings', 'clients', 'services', 'staff', 'settings'],
  independent_stylist: ['dashboard', 'calendar', 'bookings', 'clients', 'services', 'settings'],
  salon_manager:      ['dashboard', 'calendar', 'bookings', 'clients', 'services', 'staff', 'settings'],
  chair_renter:       ['dashboard', 'calendar', 'bookings', 'clients', 'services', 'settings'],
};

// Label overrides per role (only specify overrides, fallback to default label)
const labelOverrides: Record<UserRole, Partial<Record<NavKey, string>>> = {
  salon_owner: {},
  independent_stylist: {
    bookings: 'My Bookings',
    calendar: 'My Schedule',
  },
  salon_manager: {},
  chair_renter: {
    dashboard: 'My Dashboard',
    bookings: 'My Bookings',
    calendar: 'My Schedule',
    clients: 'My Clients',
    services: 'My Services',
  },
};

export function getVisibleNavKeys(role: UserRole): NavKey[] {
  return navVisibility[role];
}

export function getNavLabel(role: UserRole, key: NavKey, defaultLabel: string): string {
  return labelOverrides[role][key] ?? defaultLabel;
}

// --- Feature Flags ---

export interface RoleFeatureFlags {
  canManageStaff: boolean;
  canViewRevenue: boolean;
  canViewBusinessStats: boolean;
  canManageBusiness: boolean;
  canManageBilling: boolean;
  canViewClientInsights: boolean;
  showPersonalizedDashboard: boolean;
}

const featureFlags: Record<UserRole, RoleFeatureFlags> = {
  salon_owner: {
    canManageStaff: true,
    canViewRevenue: true,
    canViewBusinessStats: true,
    canManageBusiness: true,
    canManageBilling: true,
    canViewClientInsights: true,
    showPersonalizedDashboard: false,
  },
  independent_stylist: {
    canManageStaff: false,
    canViewRevenue: true,
    canViewBusinessStats: false,
    canManageBusiness: true,
    canManageBilling: true,
    canViewClientInsights: true,
    showPersonalizedDashboard: true,
  },
  salon_manager: {
    canManageStaff: true,
    canViewRevenue: true,
    canViewBusinessStats: true,
    canManageBusiness: true,
    canManageBilling: false,
    canViewClientInsights: true,
    showPersonalizedDashboard: false,
  },
  chair_renter: {
    canManageStaff: false,
    canViewRevenue: false,
    canViewBusinessStats: false,
    canManageBusiness: false,
    canManageBilling: false,
    canViewClientInsights: false,
    showPersonalizedDashboard: true,
  },
};

export function getFeatureFlags(role: UserRole): RoleFeatureFlags {
  return featureFlags[role];
}
