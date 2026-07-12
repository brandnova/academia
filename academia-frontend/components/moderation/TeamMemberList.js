"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import UserSearchPicker from "./UserSearchPicker";

export default function TeamMemberList({ hubId, role, canManage }) {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState("");
  const [addStatus, setAddStatus] = useState("idle");
  const [addError, setAddError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await clientFetch(`/hubs/${hubId}/${role}/`);
      setMembers(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [hubId, role]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(selectedUser) {
    setAddStatus("loading");
    setAddError("");
    try {
      const assignment = await clientFetch(`/hubs/${hubId}/${role}/`, {
        method: "POST",
        body: JSON.stringify({ user_id: selectedUser.id }),
      });
      setMembers((prev) => [...prev, assignment]);
      setAddStatus("idle");
    } catch (err) {
      setAddStatus("error");
      setAddError(err.message);
    }
  }

  async function handleRemove(memberUserId) {
    setRemovingId(memberUserId);
    setRemoveError("");
    try {
      await clientFetch(`/hubs/${hubId}/${role}/${memberUserId}/`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.user.id !== memberUserId));
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  if (status === "loading") return <Skeleton className="h-20 w-full" />;
  if (status === "error") {
    return <p className="text-red-600 dark:text-red-400 text-sm">Couldn't load: {errorMsg}</p>;
  }

  return (
    <div>
      {members.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">None assigned yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)] mb-3">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 px-2 text-sm">
              <span>{m.user.full_name}</span>
              {canManage && (
                <button
                  onClick={() => handleRemove(m.user.id)}
                  disabled={removingId === m.user.id}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                  aria-label={`Remove ${m.user.full_name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {removeError && <p className="text-red-600 dark:text-red-400 text-xs mb-2">{removeError}</p>}

      {canManage && (
        <>
          <UserSearchPicker onSelect={handleAdd} excludeIds={members.map((m) => m.user.id)} />
          {addStatus === "loading" && <p className="text-xs text-gray-400 mt-1">Adding...</p>}
          {addStatus === "error" && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">{addError}</p>
          )}
        </>
      )}
    </div>
  );
}