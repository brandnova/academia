import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, MapPin, ShieldCheck, MessageSquare, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import RequestHubCTA from "@/components/schools/RequestHubCTA";
import ManageDepartmentsLink from "@/components/schools/ManageDepartmentsLink";
import HubQuestionList from "@/components/hubs/HubQuestionList";

async function getSchool(id) {
  try {
    return await apiFetch(`/schools/${id}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const school = await getSchool(id);
  if (!school) return {};
  return {
    title: school.name,
    description: `Questions and answers for ${school.name} students, organized by department.`,
  };
}

async function getHub(schoolId) {
  try {
    return await apiFetch(`/hubs/by-school/${schoolId}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export default async function SchoolProfilePage({ params }) {
  const { id } = await params;
  const school = await getSchool(id);
  if (!school) notFound();

  const hub = school.has_hub ? await getHub(id) : null;
  const activeDepartments = school.departments?.filter((d) => d.is_active) ?? [];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div>
            <h1 className="text-2xl font-semibold">{school.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{school.short_name}</p>
          </div>
          {hub && (
            <Link
              href={`/questions/new?hub=${hub.id}`}
              className="shrink-0 text-sm px-4 py-2 rounded bg-accent text-white"
            >
              Ask a question
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {school.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {school.location}
            </span>
          )}
          {school.website && (
            <a
              href={school.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-accent hover:underline"
            >
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
          {school.verification_status === "VERIFIED" && (
            <span className="flex items-center gap-1 text-accent">
              <ShieldCheck className="w-4 h-4" /> Verified
            </span>
          )}
          {hub && (
            <>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" /> {hub.question_count} question
                {hub.question_count !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {hub.moderator_count} moderator
                {hub.moderator_count !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>

      {hub ? (
        <>
          <div className="flex justify-end mb-2">
            <ManageDepartmentsLink schoolId={school.id} />
          </div>
          <HubQuestionList hubId={hub.id} departments={activeDepartments} />
        </>
      ) : (
        <RequestHubCTA schoolId={school.id} schoolName={school.name} />
      )}
    </div>
  );
}