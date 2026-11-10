"use client";

import { useState } from "react";
import { CheckCircle2, PowerOff } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import ErrorMessage from "@/components/ui/ErrorMessage";

// Take a hub offline or bring it back (PATCH /hubs/{id}/, admin only).
// Taking it offline asks for confirmation, restoring is instant and
// reversible so it does not.
export default function HubStatusControl({ hub, onChanged }) {
  const { refreshUser } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const offline = hub.is_active === false;

  async function setActive(nextActive) {
    setSaving(true);
    setErrorMsg("");
    try {
      const updated = await clientFetch(`/hubs/${hub.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextActive }),
      });
      setConfirming(false);
      onChanged(updated);
      // GET /users/me/ only lists active hubs in moderator_for and
      // representative_for, so an admin who also holds a role here needs a
      // fresh copy for the sidebar and /moderation to follow.
      refreshUser();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`rounded-lg border px-4 py-3 mb-4 ${
        offline
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10"
          : "border-[var(--color-border)]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{hub.school.name}</p>
          <p
            className={`flex items-center gap-1.5 text-sm font-medium ${
              offline ? "text-amber-700 dark:text-amber-400" : ""
            }`}
          >
            {offline ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-success dark:text-success-dark" />
            )}
            {offline ? "Hub offline" : "Hub active"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {offline
              ? "Hidden from everyone except admins. Assignments are kept and return when the hub is restored."
              : "Visible to everyone."}
          </p>
        </div>

        {!confirming &&
          (offline ? (
            <button
              onClick={() => setActive(true)}
              disabled={saving}
              className="text-sm px-4 py-2 rounded bg-accent text-white disabled:opacity-50"
            >
              {saving ? "Restoring..." : "Restore hub"}
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm px-4 py-2 rounded border border-red-300 text-red-600 dark:text-red-400"
            >
              Take hub offline
            </button>
          ))}
      </div>

      {confirming && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-sm mb-3">
            Take this hub offline? It disappears for everyone except admins, the school goes back to
            &quot;no hub yet&quot;, and no new questions can be asked. Existing content is kept, and
            moderator and representative assignments come back when you restore the hub.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActive(false)}
              disabled={saving}
              className="text-sm px-4 py-2 rounded border border-red-300 text-red-600 dark:text-red-400 disabled:opacity-50"
            >
              {saving ? "Taking offline..." : "Take hub offline"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={saving}
              className="text-sm text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ErrorMessage size="xs" className="mt-2">
        {errorMsg}
      </ErrorMessage>
    </div>
  );
}