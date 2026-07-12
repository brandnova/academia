import { Circle, MessageCircle, CheckCircle2 } from "lucide-react";

const STATUS_CONFIG = {
  OPEN: { icon: Circle, label: "Open", className: "text-gray-400" },
  ANSWERED: { icon: MessageCircle, label: "Answered", className: "text-accent" },
  SOLVED: { icon: CheckCircle2, label: "Solved", className: "text-success dark:text-success-dark" },
};

export default function StatusIcon({ status, showLabel = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="w-4 h-4" aria-label={config.label} />
      {showLabel && <span className="text-xs">{config.label}</span>}
    </span>
  );
}