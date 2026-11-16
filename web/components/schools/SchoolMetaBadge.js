export default function SchoolMetaBadge({ icon: Icon, label }) {
  if (!label) return null;

  return (
    <span className="flex items-center gap-1.5">
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}