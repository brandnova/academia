"use client";

import { Menu } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function TopBar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bg)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="text-gray-500 dark:text-gray-400 hover:text-accent"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold">Academia</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}