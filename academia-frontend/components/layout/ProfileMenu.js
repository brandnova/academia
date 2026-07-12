"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

function truncateName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  const initials = rest.map((p) => `${p[0]?.toUpperCase()}.`).join(" ");
  return `${first} ${initials}`;
}

export default function ProfileMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <span className="text-sm text-gray-400">Loading...</span>;

  if (!user) return <GoogleLoginButton />;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span className="max-w-[140px] truncate">{truncateName(user.full_name)}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="fixed top-16 right-4 w-44 sm:absolute sm:top-full sm:right-0 sm:mt-2 bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded-lg shadow-lg py-1 text-sm z-50">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <User className="w-4 h-4" />
            Your profile
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}