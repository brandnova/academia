"use client";

import { useAuth } from "@/lib/auth-context";
import HubTeamManager from "@/components/moderation/HubTeamManager";

export default function ModerationPage() {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-gray-500">Loading...</p>;

  if (!user) {
    return (
      <p className="text-gray-500 dark:text-gray-400">You need to log in to view this page.</p>
    );
  }

  const repHubs = user.representative_for || [];
  const modHubs = user.moderator_for || [];

  const ownHubMap = new Map();
  repHubs.forEach((r) =>
    ownHubMap.set(r.hub_id, { id: r.hub_id, school: r.school, isRep: true, isMod: false })
  );
  modHubs.forEach((m) => {
    const existing = ownHubMap.get(m.hub_id);
    if (existing) existing.isMod = true;
    else ownHubMap.set(m.hub_id, { id: m.hub_id, school: m.school, isRep: false, isMod: true });
  });
  const ownHubs = Array.from(ownHubMap.values());

  if (ownHubs.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        You don't currently hold a moderator or representative role for any hub.
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Moderation</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Tools for the hubs you help manage.
      </p>
      {ownHubs.map((hub) => (
        <HubTeamManager
          key={hub.id}
          hub={hub}
          canManageModerators={hub.isRep}
          canManageRepresentatives={false}
          canManageDepartments={hub.isRep}
          isModerator={hub.isMod}
        />
      ))}
    </div>
  );
}