"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2 } from "lucide-react";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import DepartmentForm from "@/components/departments/DepartmentForm";
import DepartmentRow from "@/components/departments/DepartmentRow";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";

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
    return <ErrorMessage>Couldn't load: {errorMsg}</ErrorMessage>;
  }

  return (
    <div>
      <DepartmentForm schoolId={schoolId} onCreated={handleCreated} />
      {departments.length === 0 ? (
        <EmptyState variant="inline" icon={Building2} title="No departments yet" />
      ) : (
        <ul className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {departments.map((dept) => (
            <DepartmentRow key={dept.id} department={dept} onUpdated={handleUpdated} />
          ))}
        </ul>
      )}
    </div>
  );
}