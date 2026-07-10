import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

export default function SchoolListRow({ school }) {
  return (
    <Link
      href={`/schools/${school.id}`}
      className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        {school.has_hub ? (
          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" aria-label="Hub active" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" aria-label="No hub yet" />
        )}
        <div className="min-w-0">
          <p className="font-medium truncate">{school.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {school.short_name}{school.location ? ` · ${school.location}` : ""}
          </p>
        </div>
      </div>
      <span className="text-xs text-gray-400 shrink-0 ml-4">
        {school.has_hub ? "Hub active" : "No hub yet"}
      </span>
    </Link>
  );
}