"use client";

import { BadgeCheck } from "lucide-react";
import { isPlatformAccount } from "@/lib/platformAccount";
import Dropdown from "./Dropdown";

export default function PlatformAuthorBadge({ authorId }) {
  if (!isPlatformAccount(authorId)) return null;

  return (
    <Dropdown
      panelClassName="absolute top-full mt-1 left-0 w-60 p-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="This is an official Academia account, tap for details"
          aria-expanded={open}
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-extrabold leading-none shrink-0"
        >
          <BadgeCheck className="w-3.5 h-3.5" />
        </button>
      )}
    >
      {() => (
        <p>
          <strong className="text-accent">Official Academia account.</strong>{" "}
          This content was posted by someone from Academia's own team, not a regular account.
        </p>
      )}
    </Dropdown>
  );
}