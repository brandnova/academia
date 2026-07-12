"use client";

import { useState } from "react";
import Link from "next/link";
import TeamMemberList from "./TeamMemberList";
import HubDepartmentsTab from "./HubDepartmentsTab";
import HubUnansweredTab from "./HubUnansweredTab";

export default function HubTeamManager({
  hub,
  canManageModerators,
  canManageRepresentatives,
  canManageDepartments,
  isModerator,
}) {
  const [tab, setTab] = useState(
    canManageDepartments
      ? "departments"
      : canManageModerators
      ? "moderators"
      : canManageRepresentatives
      ? "representatives"
      : "unanswered"
  );

  const tabs = [
    canManageDepartments && { key: "departments", label: "Departments" },
    canManageModerators && { key: "moderators", label: "Moderators" },
    canManageRepresentatives && { key: "representatives", label: "Representatives" },
    { key: "unanswered", label: "Unanswered questions" },
  ].filter(Boolean);

  return (
    <div className="border border-[var(--color-border)] rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{hub.school.name}</h3>
        <Link href={`/schools/${hub.school.id}`} className="text-xs text-accent hover:underline">
          Visit school
        </Link>
      </div>

      {tabs.length > 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1 rounded border ${
                tab === t.key
                  ? "border-accent text-accent"
                  : "border-[var(--color-border)] text-gray-500 dark:text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === "departments" && canManageDepartments && (
        <HubDepartmentsTab schoolId={hub.school.id} />
      )}
      {tab === "moderators" && canManageModerators && (
        <TeamMemberList hubId={hub.id} role="moderators" canManage />
      )}
      {tab === "representatives" && canManageRepresentatives && (
        <TeamMemberList hubId={hub.id} role="representatives" canManage />
      )}
      {tab === "unanswered" && <HubUnansweredTab hubId={hub.id} isModerator={isModerator} />}
    </div>
  );
}