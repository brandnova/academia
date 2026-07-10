"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function ManageDepartmentsLink({ schoolId }) {
  const { user } = useAuth();

  if (!user) return null;

  const canManage =
    user.is_admin || user.representative_for?.some((r) => r.school.id === schoolId);

  if (!canManage) return null;

  return (
    <Link href={`/schools/${schoolId}/departments`} className="text-sm text-accent hover:underline">
      Manage departments
    </Link>
  );
}