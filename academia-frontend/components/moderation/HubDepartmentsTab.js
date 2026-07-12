"use client";

import { useState, useEffect, useCallback } from "react";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import DepartmentForm from "@/components/departments/DepartmentForm";
import DepartmentRow from "@/components/departments/DepartmentRow";

export default function HubDepartmentsTab({ schoolId }) {
  const [departments, setDepartments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await clientFetch(`/schools/${schoolId}/departments/`);
      setDepartments(data.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(dept) {
    setDepartments((prev) => [...prev, dept]);
  }

  function handleUpdated(updated) {
    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  if (status === "loading") return <Skeleton className="h-32 w-full" />;
  if (status === "error") {
    return <p className="text-red-600 dark:text-red-400 text-sm">Couldn't load: {errorMsg}</p>;
  }

  return (
    <div>
      <DepartmentForm schoolId={schoolId} onCreated={handleCreated} />
      {departments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No departments yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-[var(--color-border)]">
          {departments.map((dept) => (
            <DepartmentRow key={dept.id} department={dept} onUpdated={handleUpdated} />
          ))}
        </ul>
      )}
    </div>
  );
}