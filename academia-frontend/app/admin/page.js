"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ReportsDashboard from "@/components/moderation/ReportsDashboard";
import SchoolsManager from "@/components/admin/SchoolsManager";
import ActivationRequestsQueue from "@/components/admin/ActivationRequestsQueue";
import UsersManager from "@/components/admin/UsersManager";
import AdminHubPicker from "@/components/moderation/AdminHubPicker";
import UnansweredQueue from "@/components/moderation/UnansweredQueue";

const TABS = [
  { key: "reports", label: "Reports" },
  { key: "schools", label: "Schools" },
  { key: "activation", label: "Activation requests" },
  { key: "users", label: "Users" },
  { key: "hubs", label: "Hub teams" },
  { key: "unanswered", label: "Unanswered" },
];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("reports");

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!user || !user.is_admin) {
    return <p className="text-gray-500 dark:text-gray-400">Admin access required.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-4">Admin</h1>

      <div className="flex gap-2 mb-6 flex-wrap border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-3 py-2 border-b-2 -mb-px ${
              tab === t.key
                ? "border-accent text-accent font-medium"
                : "border-transparent text-gray-500 dark:text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reports" && <ReportsDashboard />}
      {tab === "schools" && <SchoolsManager />}
      {tab === "activation" && <ActivationRequestsQueue />}
      {tab === "users" && <UsersManager />}
      {tab === "hubs" && <AdminHubPicker />}
      {tab === "unanswered" && <UnansweredQueue showSchool />}
    </div>
  );
}