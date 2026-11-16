import { useCapabilities } from './useCapabilities';
import { useStaffWeb } from './StaffWebProvider';

/** Notification types that only make sense in the admin web dashboard. */
export const ADMIN_WEB_NOTIFICATION_TYPES = new Set([
  'NEW_REPORT',
  'NEW_ACTIVATION_REQUEST',
]);

export function adminWebPathFor(type: string): string | null {
  if (type === 'NEW_REPORT') return '/admin';
  if (type === 'NEW_ACTIVATION_REQUEST') return '/admin';
  return null;
}

export function useAdminNotificationWeb(type: string, onOpen: () => void) {
  const { isAdmin } = useCapabilities();
  const { openOnWeb } = useStaffWeb();
  const path = adminWebPathFor(type);
  if (!isAdmin || !path) return null;
  return () => {
    onOpen();
    openOnWeb(path, 'Admin dashboard');
  };
}
