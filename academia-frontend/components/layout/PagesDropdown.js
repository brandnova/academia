"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ChevronDown } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";

export default function PagesDropdown({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("idle");

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && status === "idle") {
      setStatus("loading");
      try {
        const data = await clientFetch("/pages/");
        // Client-side filter: /pages/ returns everything the requester is
        // allowed to see, including an admin's own unpublished drafts.
        // This dropdown's job is "what a public visitor sees", not
        // "everything the backend returned to me", so both checks matter.
        setPages(data.results.filter((p) => p.visibility === "PUBLIC" && p.is_published));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="flex items-center gap-3">
          <FileText className="w-4 h-4" /> Pages
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pl-10 py-1 space-y-0.5">
          {status === "loading" && <p className="text-xs text-gray-400 py-1">Loading...</p>}
          {status === "error" && <p className="text-xs text-red-500 py-1">Couldn't load.</p>}
          {status === "ready" && pages.length === 0 && (
            <p className="text-xs text-gray-400 py-1">No pages yet.</p>
          )}
          {status === "ready" &&
            pages.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.slug}`}
                onClick={onNavigate}
                className="block text-sm text-gray-500 dark:text-gray-400 hover:text-accent py-1"
              >
                {p.title}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}