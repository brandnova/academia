"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";

const NOTICE_TONES = {
  warning:
    "border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400",
  error:
    "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400",
};

// onlyWithHub is true for the Ask form (you can only ask where a hub is
// active). The admin hub picker passes false so it can also find schools whose
// hub was taken offline, which the backend reports as has_hub: false.
//
// notice is { schoolId, text, tone } and renders directly under that school's
// row, so feedback about a pick appears where the user just clicked. busyId
// marks the row being opened and disables the others.
export default function SchoolPicker({
  onSelect,
  onlyWithHub = true,
  placeholder = "Search for your school...",
  notice = null,
  busyId = null,
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [schools, setSchools] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const requestId = useRef(0);

  const fetchSchools = useCallback(async () => {
    const id = ++requestId.current;
    setStatus("loading");
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      if (onlyWithHub) params.set("has_hub", "true");
      if (debouncedQuery) params.set("search", debouncedQuery);
      params.set("page_size", "10");
      const data = await clientFetch(`/schools/?${params.toString()}`);
      if (id !== requestId.current) return;
      setSchools(data.results);
      setStatus("ready");
    } catch (err) {
      if (id !== requestId.current) return;
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [debouncedQuery, onlyWithHub]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return (
    <div>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={placeholder}
        loading={query !== debouncedQuery}
      />
      <div className="mt-4">
        {status === "loading" && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {status === "error" && <ErrorMessage>Couldn't load schools: {errorMsg}</ErrorMessage>}
        {status === "ready" && schools.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              {onlyWithHub ? "No schools with an active hub found" : "No schools found"}
              {debouncedQuery ? ` for "${debouncedQuery}"` : ""}.
            </p>
            {onlyWithHub && !debouncedQuery && (
              <p className="mt-1">
                Don't see your school?{" "}
                <Link href="/schools" className="text-accent hover:underline">
                  Browse the full directory
                </Link>{" "}
                to request a hub.
              </p>
            )}
          </div>
        )}
        {status === "ready" && schools.length > 0 && (
          <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {schools.map((school) => (
              <li key={school.id}>
                <button
                  type="button"
                  onClick={() => onSelect(school)}
                  disabled={Boolean(busyId)}
                  className="w-full flex items-center justify-between gap-3 text-left py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-sm truncate">{school.name}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                      {school.short_name}
                      {school.location ? ` · ${school.location}` : ""}
                    </span>
                  </span>
                  {!onlyWithHub && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {busyId === school.id
                        ? "Opening..."
                        : school.has_hub
                        ? "Hub active"
                        : "No active hub"}
                    </span>
                  )}
                </button>
                {notice?.schoolId === school.id && (
                  <p
                    role="status"
                    className={`mx-2 mb-2 rounded border px-3 py-2 text-xs ${
                      NOTICE_TONES[notice.tone] ?? NOTICE_TONES.warning
                    }`}
                  >
                    {notice.text}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}