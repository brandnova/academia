"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import Skeleton from "@/components/ui/Skeleton";
import DepartmentForm from "@/components/departments/DepartmentForm";
import DepartmentRow from "@/components/departments/DepartmentRow";

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
      <p className="text-gray-500 dark:text-gray-400">
        You need to log in to manage departments.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-red-600 dark:text-red-400 text-sm">
        Couldn't load this page: {errorMsg}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/schools/${id}`} className="text-sm text-accent hover:underline">
          &larr; Back to {school.name}
        </Link>
        <h1 className="text-xl font-semibold mt-2">Manage Departments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Add, rename, or deactivate departments for {school.name}. Requires School
          Representative or admin status for this hub, enforced by the backend.
        </p>
      </div>

      <DepartmentForm schoolId={id} onCreated={handleCreated} />

      {departments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No departments yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700">
          {departments.map((dept) => (
            <DepartmentRow key={dept.id} department={dept} onUpdated={handleUpdated} />
          ))}
        </ul>
      )}
    </div>
  );
}