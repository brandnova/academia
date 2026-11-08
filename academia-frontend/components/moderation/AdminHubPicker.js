"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import SchoolPicker from "@/components/questions/SchoolPicker";
import HubStatusControl from "@/components/admin/HubStatusControl";
import HubTeamManager from "./HubTeamManager";

export default function AdminHubPicker() {
  const [hub, setHub] = useState(null);
  const [notice, setNotice] = useState(null);
  const [openingId, setOpeningId] = useState(null);

  async function handleSelect(school) {
    if (openingId) return;
    setNotice(null);
    setOpeningId(school.id);
    try {
      // Admins can read an offline hub through this route, everyone else
      // gets a 404 for it.
      const data = await clientFetch(`/hubs/by-school/${school.id}/`);
      setHub(data);
    } catch (err) {
      setNotice({
        schoolId: school.id,
        tone: err.status === 404 ? "warning" : "error",
        text:
          err.status === 404
            ? "This school has no hub yet. A hub is created when an activation request is approved, see the Activation requests tab."
            : err.message,
      });
    } finally {
      setOpeningId(null);
    }
  }

  function handleChooseDifferent() {
    setHub(null);
    setNotice(null);
  }

  if (hub) {
    const offline = hub.is_active === false;

    return (
      <div>
        <button onClick={handleChooseDifferent} className="text-xs text-accent hover:underline mb-3">
          Choose a different school
        </button>

        <HubStatusControl hub={hub} onChanged={setHub} />

        {offline ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Moderators, representatives and the unanswered queue are unavailable while the hub is
            offline.
          </p>
        ) : (
          <HubTeamManager
            hub={hub}
            canManageModerators
            canManageRepresentatives
            canManageDepartments
            // Admins implicitly hold every hub's moderator permission per
            // api-contract.md's Frontend Permission Model, this isn't a real
            // ModeratorAssignment lookup, it's the documented blanket grant,
            // named explicitly so it's never mistaken for one.
            isModerator="admin-implicit"
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Pick any school to manage its hub: moderators, representatives, departments, or take the
        hub offline.
      </p>
      <SchoolPicker
        onSelect={handleSelect}
        onlyWithHub={false}
        placeholder="Search all schools..."
        notice={notice}
        busyId={openingId}
      />
    </div>
  );
}