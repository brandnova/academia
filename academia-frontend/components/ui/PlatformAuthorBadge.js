import { BadgeCheck } from "lucide-react";
import { isPlatformAccount } from "@/lib/platformAccount";

export default function PlatformAuthorBadge({ authorId }) {
  if (!isPlatformAccount(authorId)) return null;

  return (
    <span
      className="inline-flex items-center text-accent"
      title="Academia's official account"
    >
      <BadgeCheck className="w-3.5 h-3.5" />
    </span>
  );
}