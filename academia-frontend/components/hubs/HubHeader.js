import { Users, MessageSquare } from "lucide-react";

export default function HubHeader({ hub }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{hub.school.name}</h1>
      <p className="text-gray-500 dark:text-gray-400">{hub.school.short_name}</p>
      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4" /> {hub.question_count} question
          {hub.question_count !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" /> {hub.moderator_count} moderator
          {hub.moderator_count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}