"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, School, Tag, Search, PlusCircle, ShieldCheck, Wrench } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ThemeToggle from "./ThemeToggle";

const BASE_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/schools", label: "Schools", icon: School },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/search", label: "Search", icon: Search },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const hasModerationAccess =
    user && ((user.moderator_for?.length ?? 0) > 0 || (user.representative_for?.length ?? 0) > 0);

  const hasRoleLinks = user && (hasModerationAccess || user?.is_admin);
  const links = [
    ...BASE_LINKS,
    ...(user ? [{ href: "/questions/new", label: "Ask a question", icon: PlusCircle }] : []),
    ...(hasRoleLinks ? [{ type: "separator" }] : []),
    ...(hasModerationAccess
      ? [{ href: "/moderation", label: "Moderation", icon: ShieldCheck }]
      : []),
    ...(user?.is_admin ? [{ href: "/admin", label: "Admin", icon: Wrench }] : []),
  ];

  return (
    <>
      {isOpen && <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4 border-b border-[var(--color-border)]">
          <Link href="/" className="font-semibold text-lg" onClick={onClose}>
            Academia
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {links.map((item) => {
            if (item.type === "separator") {
              return <div key="sep" className="border-t border-[var(--color-border)] my-2" />;
            }
            const { href, label, icon: Icon } = item;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}