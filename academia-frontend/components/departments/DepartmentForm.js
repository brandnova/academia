"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";

export default function DepartmentForm({ schoolId, onCreated }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const dept = await clientFetch(`/schools/${schoolId}/departments/`, {
        method: "POST",
        body: JSON.stringify({ name, code: code || undefined }),
      });
      onCreated(dept);
      setName("");
      setCode("");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      setStatus("error");
      setError(
        err.status === 403
          ? "You don't have permission to add departments for this school."
          : err.message
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 mb-6">
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        />
      </div>
      <div className="w-28">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 rounded bg-accent text-white text-sm disabled:opacity-50"
      >
        {status === "loading" ? "Adding..." : "Add department"}
      </button>
      {status === "error" && (
        <p className="text-red-600 dark:text-red-400 text-sm w-full">{error}</p>
      )}
      {status === "success" && (
        <p className="text-green-600 dark:text-green-400 text-sm w-full">Added.</p>
      )}
    </form>
  );
}