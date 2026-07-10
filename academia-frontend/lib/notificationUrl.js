// Only "question" and "hub" have a real standalone page in this app. "answer"
// and "comment" notifications (VOTE, NEW_COMMENT) have nowhere to deep-link
// to yet, flagged as a Known Deviation, resolved either by adding an answer
// detail route or by having those notifications point at the parent question.
export function notificationTargetUrl(notification) {
  const { related_object_type, related_object_id } = notification;
  if (!related_object_type || !related_object_id) return null;
  if (related_object_type === "question") return `/questions/${related_object_id}`;
  if (related_object_type === "hub") return `/hubs/${related_object_id}`;
  return null;
}