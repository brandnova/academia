import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, Globe2, MapPin, Map, Landmark, Shield, ShieldCheck, MessageSquare, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { INSTITUTION_TYPE_LABELS, OWNERSHIP_LABELS } from "@/lib/schoolLabels";
import SchoolMetaBadge from "@/components/schools/SchoolMetaBadge";
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

  const hasClassificationMeta =
    school.institution_type || school.ownership || school.state || school.country !== "Nigeria";

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold truncate">{school.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{school.short_name}</p>
          </div>
          {hub && (
            <Link
              href={`/questions/new?hub=${hub.id}`}
              className="shrink-0 text-sm px-4 py-2 rounded bg-accent text-white text-center w-full sm:w-auto"
            >
              Ask a question
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          {school.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {school.location}
            </span>
          )}
          {school.website && (
            <a
              href={school.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-accent hover:underline"
            >
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
          {school.verification_status === "VERIFIED" && (
            <span className="flex items-center gap-1.5 text-accent">
              <ShieldCheck className="w-4 h-4" /> Verified
            </span>
          )}
        </div>

        {hasClassificationMeta && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-[var(--color-border)]">
            <SchoolMetaBadge icon={Landmark} label={INSTITUTION_TYPE_LABELS[school.institution_type]} />
            <SchoolMetaBadge icon={Shield} label={OWNERSHIP_LABELS[school.ownership]} />
            <SchoolMetaBadge icon={Map} label={school.state} />
            {school.country !== "Nigeria" && (
              <SchoolMetaBadge icon={Globe2} label={school.country} />
            )}
            {/*
              TODO(i18n): once Academia establishes a genuine multi-country
              presence, remove the `school.country !== "Nigeria"` guard above
              so the Globe2 badge renders unconditionally for every school,
              Nigerian ones included. The guard exists only because a
              single-country dataset showing "Nigeria" on 100% of schools is
              noise, not information, see the original issue's reasoning.
              That reasoning stops applying the moment a second country is
              real. Tracked in feature-list.md's Internationalization
              (Future) section, not part of the current audit-fix backlog.
            */}
          </div>
        )}

        {hub && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-[var(--color-border)]">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> {hub.question_count} question
              {hub.question_count !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {hub.moderator_count} moderator
              {hub.moderator_count !== 1 ? "s" : ""}
            </span>
          </div>
        )}
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