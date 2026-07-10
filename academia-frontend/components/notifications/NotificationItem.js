"use client";

import Link from "next/link";
import { MessageSquare, Award, CheckCircle2, MessageCircle, ThumbsUp, Bell } from "lucide-react";
import { notificationTargetUrl } from "@/lib/notificationUrl";
import { timeAgo } from "@/lib/timeAgo";

const ICONS = {
  NEW_ANSWER: MessageSquare,
  BEST_ANSWER: Award,
  HUB_ACTIVATED: CheckCircle2,
  NEW_COMMENT: MessageCircle,
  VOTE: ThumbsUp,
};

export default function NotificationItem({ notification, onRead, onNavigate }) {
  const Icon = ICONS[notification.type] || Bell;
  const url = notificationTargetUrl(notification);

  function handleClick() {
    if (!notification.is_read) onRead(notification.id);
    onNavigate?.();
  }

  const content = (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 text-sm ${
        !notification.is_read ? "bg-accent/5" : ""
      }`}
    >
      <Icon
        className={`w-4 h-4 mt-0.5 shrink-0 ${
          !notification.is_read ? "text-accent" : "text-gray-400"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={
            !notification.is_read
              ? "font-medium"
              : "text-gray-600 dark:text-gray-400"
          }
        >
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && (
        <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
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