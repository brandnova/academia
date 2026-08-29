"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import Dropdown from "./Dropdown";

export default function ActionsMenu({ items, align = "right", triggerLabel = "More actions" }) {
  const visibleItems = (items || []).filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <Dropdown
      panelClassName={`absolute top-full mt-1 ${
        align === "right" ? "right-0" : "left-0"
      } w-48 py-1 text-sm`}
      trigger={({ open, toggle }) => (
        <button
          onClick={toggle}
          aria-label={triggerLabel}
          aria-expanded={open}
          aria-haspopup="true"
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      )}
    >
      {({ close }) =>
        visibleItems.map((item, i) => {
          const classes = `w-full flex items-center gap-2 px-3 py-2 text-left disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 ${
            item.danger ? "text-red-600 dark:text-red-400" : item.accent ? "text-accent" : ""
          }`;
          const content = (
            <>
              {item.icon && <item.icon className="w-4 h-4" />}
              {item.label}
            </>
          );

          if (item.href) {
            return (
              <Link key={item.key || i} href={item.href} onClick={close} className={classes}>
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.key || i}
              onClick={() => {
                item.onClick?.();
                close();
              }}
              disabled={item.disabled}
              className={classes}
            >
              {content}
            </button>
          );
        })
      }
    </Dropdown>
  );
}