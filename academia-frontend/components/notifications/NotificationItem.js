"use client";

import Link from "next/link";
import { MessageSquare, Award, CheckCircle2, MessageCircle, ThumbsUp, ShieldCheck, HelpCircle, Building2, Flag, Bell, Ban, XCircle, FileCheck2} from "lucide-react";
import { notificationTargetUrl } from "@/lib/notificationUrl";
import { timeAgo } from "@/lib/timeAgo";

const ICONS = {
  NEW_ANSWER: MessageSquare,
  BEST_ANSWER: Award,
  HUB_ACTIVATED: CheckCircle2,
  NEW_COMMENT: MessageCircle,
  VOTE: ThumbsUp,
  MODERATOR_ASSIGNED: ShieldCheck,
  NEW_QUESTION: HelpCircle,
  NEW_ACTIVATION_REQUEST: Building2,
  NEW_REPORT: Flag,
  USER_SUSPENDED: Ban,
  HUB_ACTIVATION_REJECTED: XCircle,
  REPORT_REVIEWED: FileCheck2,
};

// compact is for the bell dropdown: every row is exactly 4.875rem tall and the
// message is clamped to two lines, so the dropdown can show an exact number of
// rows. NotificationBell's list height (4 rows = 19.5rem) depends on this
// number. Tailwind needs both as literal classes, keep them in sync.
export default function NotificationItem({ notification, onRead, onNavigate, compact = false }) {
  const Icon = ICONS[notification.type] || Bell;
  const url = notificationTargetUrl(notification);
  const unread = !notification.is_read;

  function handleClick() {
    if (unread) onRead(notification.id);
    onNavigate?.();
  }

  const content = (
    <div
      className={`flex gap-3 px-3 text-sm ${
        compact ? "h-[4.875rem] items-center" : "items-start py-2.5"
      } ${unread ? "bg-accent/5" : ""}`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${compact ? "" : "mt-0.5"} ${
          unread ? "text-accent" : "text-gray-400"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`break-words ${compact ? "line-clamp-2" : ""} ${
            unread ? "font-medium" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {unread && <span className="sr-only">Unread: </span>}
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notification.created_at)}</p>
      </div>
      {unread && (
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full bg-accent shrink-0 ${compact ? "" : "mt-1.5"}`}
        />
      )}
    </div>
  );

  if (url) {
    return (
      <Link
        href={url}
        onClick={handleClick}
        className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="block w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      {content}
    </button>
  );
}