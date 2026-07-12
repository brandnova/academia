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

  if (hub) {
    return (
      <div>
        <button onClick={() => setHub(null)} className="text-xs text-accent hover:underline mb-3">
          Choose a different school
        </button>
        <HubTeamManager
          hub={hub}
          canManageModerators
          canManageRepresentatives
          canManageDepartments
          isModerator
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