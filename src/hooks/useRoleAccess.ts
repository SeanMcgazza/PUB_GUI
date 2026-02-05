'use client';

import { useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import {
  resolveRole,
  getFeatureFlags,
  getVisibleNavKeys,
  getNavLabel,
  type UserRole,
  type NavKey,
  type RoleFeatureFlags,
} from '@/lib/role-config';

export function useRoleAccess(): RoleFeatureFlags & {
  role: UserRole;
  isNavVisible: (key: NavKey) => boolean;
  navLabel: (key: NavKey, defaultLabel: string) => string;
} {
  const { profile } = useProfile();

  return useMemo(() => {
    const role = resolveRole(profile?.role);
    const flags = getFeatureFlags(role);
    const visibleKeys = getVisibleNavKeys(role);

    return {
      role,
      ...flags,
      isNavVisible: (key: NavKey) => visibleKeys.includes(key),
      navLabel: (key: NavKey, defaultLabel: string) => getNavLabel(role, key, defaultLabel),
    };
  }, [profile?.role]);
}
