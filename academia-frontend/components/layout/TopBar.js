"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function TopBar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-sticky bg-[var(--color-bg)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="text-gray-500 dark:text-gray-400 hover:text-accent"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="font-semibold">
          Academia
        </Link>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}