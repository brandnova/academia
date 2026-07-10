import { notFound } from "next/navigation";
import Link from "next/link";
import { Globe, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import RequestHubCTA from "@/components/schools/RequestHubCTA";
import ManageDepartmentsLink from "@/components/schools/ManageDepartmentsLink";

async function getSchool(id) {
  try {
    return await apiFetch(`/schools/${id}/`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export default async function SchoolProfilePage({ params }) {
  const { id } = await params;
  const school = await getSchool(id);

  if (!school) notFound();

  const activeDepartments = school.departments?.filter((d) => d.is_active) ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{school.name}</h1>
        <p className="text-gray-500 dark:text-gray-400">{school.short_name}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
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
        </div>
      </div>

      {school.has_hub ? (
        <div>
          <Link
            href={`/hubs/by-school/${school.id}`}
            className="flex items-center gap-2 text-accent hover:underline mb-6 text-sm font-medium"
          >
            Visit hub <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Departments</h2>
            <ManageDepartmentsLink schoolId={school.id} />
          </div>
          {activeDepartments.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700">
              {activeDepartments.map((dept) => (
                <li key={dept.id} className="py-3 px-2 text-sm">
                  {dept.name}
                  {dept.code ? ` (${dept.code})` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No departments listed yet.
            </p>
          )}
        </div>
      ) : (
        <RequestHubCTA schoolId={school.id} schoolName={school.name} />
      )}
    </div>
  );
}