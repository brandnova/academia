import { redirect, notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default async function HubBySchoolRedirect({ params }) {
  const { schoolId } = await params;

  let hub;
  try {
    hub = await apiFetch(`/hubs/by-school/${schoolId}/`);
  } catch (err) {
    if (err.status === 404) notFound();
    throw err;
  }

  redirect(`/hubs/${hub.id}`);
}