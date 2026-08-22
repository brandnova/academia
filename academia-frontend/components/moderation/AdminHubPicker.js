"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import SchoolPicker from "@/components/questions/SchoolPicker";
import HubTeamManager from "./HubTeamManager";

export default function AdminHubPicker() {
  const [hub, setHub] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSelect(school) {
    setErrorMsg("");
    try {
      const data = await clientFetch(`/hubs/by-school/${school.id}/`);
      setHub(data);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  function handleChooseDifferent() {
    setHub(null);
    setErrorMsg("");
  }

  if (hub) {
    return (
      <div>
        <button onClick={handleChooseDifferent} className="text-xs text-accent hover:underline mb-3">
          Choose a different school
        </button>
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
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Pick a school to manage its hub's moderators and representatives.
      </p>
      <SchoolPicker onSelect={handleSelect} />
      {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errorMsg}</p>}
    </div>
  );
}