"use client";

import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!user) {
    return <p className="text-gray-500">You need to log in to view this page.</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Your Profile</h1>
      <p>Name: {user.full_name}</p>
      <p>Email: {user.email}</p>
      <p>Admin: {user.is_admin ? "Yes" : "No"}</p>
    </div>
  );
}