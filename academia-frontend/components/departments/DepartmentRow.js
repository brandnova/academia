"use client";

import { useState } from "react";
import { Pencil, Check, X, RotateCcw } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";

export default function DepartmentRow({ department, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(department.name);
  const [code, setCode] = useState(department.code || "");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function save() {
    setStatus("loading");
    setError("");
    try {
      const updated = await clientFetch(`/departments/${department.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name, code: code || null }),
      });
      onUpdated(updated);
      setEditing(false);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err.status === 403 ? "Permission denied." : err.message);
    }
  }

  async function toggleActive() {
    setStatus("loading");
    setError("");
    try {
      const updated = await clientFetch(`/departments/${department.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !department.is_active }),
      });
      onUpdated(updated);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err.status === 403 ? "Permission denied." : err.message);
    }
  }

  return (
    <li className="py-3 px-2 flex flex-wrap items-center justify-between gap-3">
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm flex-1"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm w-20"
          />
          <button onClick={save} disabled={status === "loading"} className="text-accent">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setEditing(false)} className="text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <span className={`text-sm ${!department.is_active ? "text-gray-400 line-through" : ""}`}>
          {department.name}
          {department.code ? ` (${department.code})` : ""}
        </span>
      )}

      {!editing && (
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-accent">
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={toggleActive}
            disabled={status === "loading"}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-accent flex items-center gap-1"
          >
            {department.is_active ? (
              "Deactivate"
            ) : (
              <>
                <RotateCcw className="w-3 h-3" /> Reactivate
              </>
            )}
          </button>
        </div>
      )}
      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-xs w-full">{error}</p>
      )}
    </li>
  );
}