"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Routes where the button would be redundant (the forms themselves) or in the
// way (staff tools).
function hiddenOn(pathname) {
  return (
    pathname === "/questions/new" ||
    /^\/questions\/[^/]+\/edit$/.test(pathname) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/moderation")
  );
}

export default function AskFab() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || hiddenOn(pathname)) return null;

  return (
    <Link
      href="/questions/new"
      aria-label="Ask a question"
      className="sm:hidden fixed right-4 z-sticky flex items-center gap-1.5 rounded-lg bg-accent text-white shadow-lg pl-3.5 pr-4 py-3 text-sm font-medium"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Plus className="w-5 h-5" />
      Ask
    </Link>
  );
}