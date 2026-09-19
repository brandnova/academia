"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { INSTITUTION_TYPE_OPTIONS, OWNERSHIP_OPTIONS } from "@/lib/schoolLabels";

export default function SchoolFormModal({ school, onClose, onSaved }) {
  const isEdit = Boolean(school);
  const [name, setName] = useState(school?.name || "");
  const [shortName, setShortName] = useState(school?.short_name || "");
  const [location, setLocation] = useState(school?.location || "");
  const [website, setWebsite] = useState(school?.website || "");
  const [institutionType, setInstitutionType] = useState(school?.institution_type || "");
  const [ownership, setOwnership] = useState(school?.ownership || "");
  const [stateName, setStateName] = useState(school?.state || "");
  const [country, setCountry] = useState(school?.country || "Nigeria");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const payload = {
        name,
        short_name: shortName,
        location: location.trim() || null,
        website: website.trim() || null,
        institution_type: institutionType || null,
        ownership: ownership || null,
        state: stateName.trim() || null,
        country: country.trim() || "Nigeria",
      };
      const saved = isEdit
        ? await clientFetch(`/schools/${school.id}/`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await clientFetch("/schools/", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      onSaved(saved);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{isEdit ? "Edit school" : "New school"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Short name
            </label>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Location (optional)
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Website (optional)
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Institution type
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Not set</option>
                {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Ownership
              </label>
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Not set</option>
                {OWNERSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                State (optional)
              </label>
              <input
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Lagos"
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Country
              </label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="text-sm px-4 py-2 rounded bg-accent text-white disabled:opacity-50"
            >
              {status === "loading" ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}