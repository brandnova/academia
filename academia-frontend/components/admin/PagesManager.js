"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import PageFormModal from "./PageFormModal";

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [modalPage, setModalPage] = useState(null); // null = closed, {} = new, {...} = editing
  const [modalLoading, setModalLoading] = useState(false);
  const [modalLoadError, setModalLoadError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await clientFetch("/pages/");
      setPages(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setModalLoadError("");
    setModalPage({});
  }

  // The list endpoint never includes `body`, only the detail endpoint does,
  // per api-contract.md. Fetch the real record before opening the editor,
  // rather than editing the list-derived stub that's missing its content.
  async function openEdit(listPage) {
    setModalLoadError("");
    setModalLoading(true);
    try {
      const full = await clientFetch(`/pages/${listPage.slug}/`);
      setModalPage(full);
    } catch (err) {
      setModalLoadError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function handleSaved(saved) {
    setPages((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
    });
    setModalPage(null);
  }

  async function handleDelete(page) {
    setDeletingId(page.id);
    setDeleteError("");
    try {
      await clientFetch(`/pages/${page.id}/`, { method: "DELETE" });
      setPages((prev) => prev.filter((p) => p.id !== page.id));
      setDeleteConfirmId(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded bg-accent text-white"
        >
          <Plus className="w-4 h-4" /> New page
        </button>
        {modalLoading && <span className="text-xs text-gray-400">Loading page...</span>}
      </div>
      {modalLoadError && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">
          Couldn't load that page for editing: {modalLoadError}
        </p>
      )}

      {status === "error" && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}
      {status === "ready" && pages.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No pages yet.</p>
      )}
      {status === "ready" && pages.length > 0 && (
        <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between py-3 px-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{page.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      page.is_published
                        ? "bg-accent/10 text-accent"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {page.is_published ? "Published" : "Draft"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {page.visibility === "STAFF" ? "Staff" : "Public"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">/pages/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-gray-400">
                <button
                  onClick={() => openEdit(page)}
                  disabled={modalLoading}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-accent disabled:opacity-40 transition-colors"
                  aria-label={`Edit ${page.title}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {deleteConfirmId === page.id ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDelete(page)}
                      disabled={deletingId === page.id}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
                    >
                      {deletingId === page.id ? "..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      disabled={deletingId === page.id}
                      className="text-xs px-2 py-1 rounded border border-[var(--color-border)] text-gray-500 dark:text-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(page.id)}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-colors"
                    aria-label={`Delete ${page.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteError && <p className="text-red-600 dark:text-red-400 text-xs mt-2">{deleteError}</p>}

      {modalPage !== null && (
        <PageFormModal
          page={Object.keys(modalPage).length ? modalPage : null}
          onClose={() => setModalPage(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}