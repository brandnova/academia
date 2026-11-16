"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";

export default function StaffGuides() {
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    clientFetch("/pages/")
      .then((data) => {
        if (cancelled) return;
        setPages(data.results.filter((p) => p.visibility === "STAFF" && p.is_published));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status !== "ready" || pages.length === 0) return null;

  return (
    <div className="mb-6 border border-[var(--color-border)] rounded-lg p-4">
      <h2 className="text-sm font-medium mb-2 flex items-center gap-1.5">
        <BookOpen className="w-4 h-4 text-accent" /> Staff guides
      </h2>
      <ul className="space-y-1">
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={`/pages/${p.slug}`} className="text-sm text-accent hover:underline">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}