"use client";

import { useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import SchoolFormModal from "./SchoolFormModal";

export default function SchoolAdminRow({ school, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    <div className="flex items-center justify-between py-3 px-2 text-sm">
      <div className="min-w-0">
        <p
          className={`font-medium truncate ${
            school.is_active === false ? "text-gray-400 line-through" : ""
          }`}
        >
          {school.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {school.short_name}
          {school.location ? ` · ${school.location}` : ""}
          {school.has_hub ? " · has hub" : ""}
        </p>
        {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">{errorMsg}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-gray-400">
        <button onClick={() => setEditing(true)} className="hover:text-accent" aria-label="Edit school">
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={toggleActive}
          disabled={toggling}
          className="text-xs hover:text-accent disabled:opacity-50"
        >
          {school.is_active === false ? (
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