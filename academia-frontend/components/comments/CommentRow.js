"use client";

import { useState } from "react";
import { Pencil, Trash2, Flag, ShieldAlert, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ReportButton from "@/components/reports/ReportButton";
import EscalateButton, { canEscalate } from "@/components/reports/EscalateButton";
import ActionsMenu from "@/components/ui/ActionsMenu";
import IconLabel from "@/components/ui/IconLabel";
import PlatformAuthorBadge from "@/components/ui/PlatformAuthorBadge";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/FormControls";

export default function CommentRow({ comment, hubId, onUpdate, onDelete }) {
  const { user } = useAuth();
  const isAuthor = user && user.id === comment.author.id;

  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // "report" | "escalate" | null

  async function save() {
    setStatus("loading");
    setErrorMsg("");
    try {
      await onUpdate(comment.id, body);
      setEditing(false);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("idle");
    }
  }

  async function remove() {
    setStatus("loading");
    setErrorMsg("");
    try {
      await onDelete(comment.id);
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("idle");
      setConfirming(false);
    }
  }

  if (editing) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            size="xs"
            fullWidth={false}
            className="flex-1 min-w-[120px]"
            aria-label="Edit comment"
          />
          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <button onClick={save} disabled={status === "loading"} className="text-accent">
              {status === "loading" ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setBody(comment.body);
              }}
              className="text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
        {errorMsg && (
          <ErrorMessage size="2xs" className="mt-1">{errorMsg}</ErrorMessage>
        )}
      </div>
    );
  }

  const menuItems = isAuthor
    ? [
        { label: "Edit", icon: Pencil, onClick: () => setEditing(true) },
        { label: "Delete", icon: Trash2, danger: true, onClick: () => setConfirming(true) },
      ]
    : [
        user && { label: "Report", icon: Flag, onClick: () => setActiveModal("report") },
        canEscalate(user, hubId) && {
          label: "Escalate to admin",
          icon: ShieldAlert,
          accent: true,
          onClick: () => setActiveModal("escalate"),
        },
      ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
      <div className="min-w-0 flex-1 mb-4">
        <IconLabel as="p" icon={User} size="xs" className="text-muted mb-0.5">
          {comment.author.full_name}
          <PlatformAuthorBadge authorId={comment.author.id} />
        </IconLabel>
        <p className="text-xs text-gray-700 dark:text-gray-300 break-words">{comment.body}</p>
      </div>

      <div className="text-[11px] flex items-center gap-2 text-muted shrink-0">
        {confirming ? (
          <>
            <button
              onClick={remove}
              disabled={status === "loading"}
              className="hover:text-red-500"
            >
              {status === "loading" ? "Deleting..." : "Confirm delete"}
            </button>
            <button onClick={() => setConfirming(false)}>Cancel</button>
          </>
        ) : (
          menuItems.length > 0 && <ActionsMenu items={menuItems} />
        )}
      </div>

      {errorMsg && <ErrorMessage size="2xs" className="w-full">{errorMsg}</ErrorMessage>}

      <ReportButton
        contentType="comment"
        contentId={comment.id}
        open={activeModal === "report"}
        onClose={() => setActiveModal(null)}
      />
      <EscalateButton
        contentType="comment"
        contentId={comment.id}
        open={activeModal === "escalate"}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}