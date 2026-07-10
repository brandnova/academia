"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, School, Tag, PlusCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ThemeToggle from "./ThemeToggle";

const BASE_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/schools", label: "Schools", icon: School },
  { href: "/tags", label: "Tags", icon: Tag },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = user
    ? [...BASE_LINKS, { href: "/questions/new", label: "Ask a question", icon: PlusCircle }]
    : BASE_LINKS;

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
          {links.map(({ href, label, icon: Icon }) => {
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