"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            Academia
          </Link>
          <Link
            href="/schools"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent"
          >
            Schools
          </Link>
          <Link
            href="/tags"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent"
          >
            Tags
          </Link>
          {user && (
            <Link
              href="/questions/new"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-accent"
            >
              Ask a question
            </Link>
          )}
        </div>
        {loading ? (
          <span className="text-sm text-gray-400">Loading...</span>
        ) : user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm">{user.full_name}</span>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
            >
              Log out
            </button>
          </div>
        ) : (
          <GoogleLoginButton />
        )}
      </div>
    </header>
  );
}