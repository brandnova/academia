"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {
      // storage can be blocked, fall back to the system preference
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // not persisted, the choice still applies for this visit
    }
  }

  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="p-2 rounded text-gray-500 dark:text-gray-400 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      {/* Both icons exist, CSS shows the one that matches the real theme. */}
      <Moon className="w-5 h-5 dark:hidden" />
      <Sun className="w-5 h-5 hidden dark:block" />
    </button>
  );
}