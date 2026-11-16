"use client";

import { use, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import { schoolUrl } from "@/lib/urls";
import Skeleton from "@/components/ui/Skeleton";
import DepartmentForm from "@/components/departments/DepartmentForm";
import DepartmentRow from "@/components/departments/DepartmentRow";
import EmptyState from "@/components/ui/EmptyState";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function ManageDepartmentsPage({ params }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [school, setSchool] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const [schoolData, deptData] = await Promise.all([
        clientFetch(`/schools/${id}/`),
        clientFetch(`/schools/${id}/departments/`),
      ]);
      setSchool(schoolData);
      setDepartments(deptData.results);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(dept) {
    setDepartments((prev) => [...prev, dept]);
  }

  function handleUpdated(updated) {
    setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  if (authLoading || status === "loading") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-muted">
        You need to log in to manage departments.
      </p>
    );
  }

  if (status === "error") {
    return (
      <ErrorMessage>
        Couldn't load this page: {errorMsg}
      </ErrorMessage>
    );
  }

  const canManage =
    user.is_admin || user.representative_for?.some((r) => r.school.id === id);

  return (
    <div>
      <div className="mb-6">
        <Link href={schoolUrl(school)} className="flex items-center gap-1.5 text-sm text-accent hover:underline w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to {school.name}
        </Link>
        <h1 className="text-xl font-semibold mt-2">Manage Departments</h1>
        <p className="text-sm text-muted">
          Add, rename, or deactivate departments for {school.name}.
        </p>
      </div>

      {!canManage && (
        <ErrorMessage tone="warning" className="border border-amber-200 dark:border-amber-800 rounded p-4 mb-6">
          You're signed in, but you're not a School Representative for this school
          or a platform admin. You can still try the form below, but the server
          will reject any change.
        </ErrorMessage>
      )}

      <DepartmentForm schoolId={id} onCreated={handleCreated} />

      {departments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No departments yet"
          description="Add the first one with the form above."
        />
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