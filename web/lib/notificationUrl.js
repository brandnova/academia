import { linkTargetUrl } from "@/lib/linkTarget";

// link_target wins for every notification type. Without one, hubs still go
// through the hub redirect, and anything else (account notices such as
// USER_SUSPENDED, rejected requests, reports, deleted content) has nowhere
// to go and renders as a non-link row.
export function notificationTargetUrl(notification) {
  const fromLinkTarget = linkTargetUrl(notification.link_target);
  if (fromLinkTarget) return fromLinkTarget;

  const { related_object_type, related_object_id } = notification;
  if (!related_object_type || !related_object_id) return null;
  if (related_object_type === "question") return `/questions/${related_object_id}`;
  if (related_object_type === "hub") return `/hubs/${related_object_id}`;
  return null;
}