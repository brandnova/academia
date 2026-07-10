import { notFound } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import HubHeader from "@/components/hubs/HubHeader";
import HubQuestionList from "@/components/hubs/HubQuestionList";

async function getHub(id) {
  try {
    return await apiFetch(`/hubs/${id}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export default async function HubHomePage({ params }) {
  const { id } = await params;
  const hub = await getHub(id);

  if (!hub) notFound();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <HubHeader hub={hub} />
        <Link
          href={`/questions/new?hub=${hub.id}`}
          className="shrink-0 text-sm px-4 py-2 rounded bg-accent text-white"
        >
          Ask a question
        </Link>
      </div>

      <HubQuestionList hubId={hub.id} departments={hub.departments ?? []} />

      <p className="text-sm mt-8">
        <Link href={`/schools/${hub.school.id}`} className="text-accent hover:underline">
          &larr; Back to {hub.school.name}
        </Link>
      </p>
    </div>
  );
}