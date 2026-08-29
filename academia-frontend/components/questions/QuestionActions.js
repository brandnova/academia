"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Flag, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import ReportButton from "@/components/reports/ReportButton";
import EscalateButton, { canEscalate } from "@/components/reports/EscalateButton";
import ActionsMenu from "@/components/ui/ActionsMenu";

export default function QuestionActions({ question }) {
  const { user } = useAuth();
  const router = useRouter();
  const isAuthor = user && user.id === question.author.id;

  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // "report" | "escalate" | null

  if (!user) return null;

  async function handleDelete() {
    setDeleteStatus("loading");
    setErrorMsg("");
    try {
      await clientFetch(`/questions/${question.id}/`, { method: "DELETE" });
      router.push(`/hubs/${question.hub.id}`);
    } catch (err) {
      setDeleteStatus("error");
      setErrorMsg(err.message);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Delete this question?</span>
        <button
          onClick={handleDelete}
          disabled={deleteStatus === "loading"}
          className="text-red-600 dark:text-red-400 disabled:opacity-50"
        >
          {deleteStatus === "loading" ? "Deleting..." : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-gray-400">
          Cancel
        </button>
        {errorMsg && <span className="text-red-600 dark:text-red-400 text-xs">{errorMsg}</span>}
      </div>
    );
  }

  const menuItems = isAuthor
    ? [
        { label: "Edit", icon: Pencil, href: `/questions/${question.id}/edit` },
        { label: "Delete", icon: Trash2, danger: true, onClick: () => setConfirming(true) },
      ]
    : [
        { label: "Report", icon: Flag, onClick: () => setActiveModal("report") },
        canEscalate(user, question.hub.id) && {
          label: "Escalate to admin",
          icon: ShieldAlert,
          accent: true,
          onClick: () => setActiveModal("escalate"),
        },
      ].filter(Boolean);

  if (menuItems.length === 0) return null;

  return (
    <>
      <ActionsMenu items={menuItems} />
      <ReportButton
        contentType="question"
        contentId={question.id}
        open={activeModal === "report"}
        onClose={() => setActiveModal(null)}
      />
      <EscalateButton
        contentType="question"
        contentId={question.id}
        open={activeModal === "escalate"}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}