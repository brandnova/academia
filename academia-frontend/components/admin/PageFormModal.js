"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import MarkdownEditor from "@/components/ui/MarkdownEditor";

export default function PageFormModal({ page, onClose, onSaved }) {
  const isEdit = Boolean(page);
  const [title, setTitle] = useState(page?.title || "");
  const [body, setBody] = useState(page?.body || "");
  const [visibility, setVisibility] = useState(page?.visibility || "PUBLIC");
  const [isPublished, setIsPublished] = useState(page?.is_published ?? false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) {
      setStatus("error");
      setErrorMsg("Body is required.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const payload = { title, body, visibility, is_published: isPublished };
      const saved = isEdit
        ? await clientFetch(`/pages/${page.id}/`, { method: "PATCH", body: JSON.stringify(payload) })
        : await clientFetch("/pages/", { method: "POST", body: JSON.stringify(payload) });
      onSaved(saved);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{isEdit ? "Edit page" : "New page"}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          {isEdit && (
            <p className="text-xs text-gray-400">
              URL: /pages/{page.slug} (never changes, even if the title does)
            </p>
          )}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Body</label>
            <MarkdownEditor
              value={body}
              onChange={setBody}
              rows={10}
              richMode
              placeholder="Write the page content..."
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="PUBLIC">Public</option>
                <option value="STAFF">Staff only</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm mt-5">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-accent"
              />
              Published
            </label>
          </div>
          {status === "error" && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
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