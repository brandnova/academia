"use client";

import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SchoolFormModal from "./SchoolFormModal";

export default function SchoolAdminRow({ school, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const inactive = school.is_active === false;

  async function toggleActive() {
    setToggling(true);
    setErrorMsg("");
    try {
      const updated = await clientFetch(`/schools/${school.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !(school.is_active ?? true) }),
      });
      onUpdated(updated);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-2 text-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className={`font-medium truncate ${inactive ? "text-gray-400 line-through" : ""}`}>
            {school.name}
          </p>
          {inactive && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Inactive
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {school.short_name}
          {school.location ? ` · ${school.location}` : ""}
          {school.has_hub ? " · has hub" : ""}
        </p>
        <ErrorMessage size="xs" className="mt-0.5">
          {errorMsg}
        </ErrorMessage>
      </div>
      <div className="flex items-center gap-3 shrink-0 text-gray-400">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent transition-colors"
          aria-label={`Edit ${school.name}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={toggleActive}
          disabled={toggling}
          className="text-xs hover:text-accent disabled:opacity-50"
        >
          {inactive ? (
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reactivate
            </span>
          ) : (
            "Deactivate"
          )}
        </button>
      </div>

      {editing && (
        <SchoolFormModal
          school={school}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            onUpdated(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}