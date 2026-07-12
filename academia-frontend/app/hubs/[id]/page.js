import { notFound, redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default async function HubRedirectPage({ params }) {
  const { id } = await params;
  let hub;
  try {
    hub = await apiFetch(`/hubs/${id}/`);
  } catch (err) {
    if (err.status === 404) notFound();
    throw err;
  }
  redirect(`/schools/${hub.school.id}`);
}