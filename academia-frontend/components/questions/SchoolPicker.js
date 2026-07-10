"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { clientFetch } from "@/lib/clientApi";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Skeleton from "@/components/ui/Skeleton";

export default function SchoolPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);
  const [schools, setSchools] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSchools = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      params.set("has_hub", "true");
      if (debouncedQuery) params.set("search", debouncedQuery);
      params.set("page_size", "10");
      const data = await clientFetch(`/schools/?${params.toString()}`);
      setSchools(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  return (
    <div>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search for your school..."
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
        {status === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm">
            Couldn't load schools: {errorMsg}
          </p>
        )}
        {status === "ready" && schools.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>
              No schools with an active hub found
              {debouncedQuery ? ` for "${debouncedQuery}"` : ""}.
            </p>
            {!debouncedQuery && (
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
          <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700">
            {schools.map((school) => (
              <li key={school.id}>
                <button
                  type="button"
                  onClick={() => onSelect(school)}
                  className="w-full text-left py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <p className="font-medium text-sm">{school.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {school.short_name}
                    {school.location ? ` · ${school.location}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}