import { useMemo } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import type { UUID } from '../../api/types';

export type CapabilityRole = 'guest' | 'student' | 'moderator' | 'representative' | 'admin';

export interface Capabilities {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  role: CapabilityRole;
  roleLabel: string;
  canModerateHub: (hubId: UUID | null | undefined) => boolean;
}

/**
 * The single source of truth for staff UI in the mobile client. Screens never
 * inspect moderator_for or representative_for directly.
 */
export function useCapabilities(): Capabilities {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => {
    const isAdmin = Boolean(user?.is_admin);
    const moderates = (user?.moderator_for?.length ?? 0) > 0;
    const represents = (user?.representative_for?.length ?? 0) > 0;
    const isStaff = isAdmin || moderates || represents;

    const role: CapabilityRole = !isAuthenticated
      ? 'guest'
      : isAdmin
        ? 'admin'
        : represents
          ? 'representative'
          : moderates
            ? 'moderator'
            : 'student';

    const normalizedRole =
      role.charAt(0).toUpperCase() + role.slice(1);

    return {
      isAuthenticated,
      isAdmin,
      isStaff,
      role,
      roleLabel: normalizedRole,
      canModerateHub: (hubId: UUID | null | undefined) => {
        if (!hubId) return false;
        if (isAdmin) return true;
        return (
          user?.moderator_for?.some((entry) => entry.hub_id === hubId) === true ||
          user?.representative_for?.some((entry) => entry.hub_id === hubId) === true
        );
      },
    };
  }, [user, isAuthenticated]);
}
