// Quiet, intentional empty state: optional icon, a title, a supporting line
// and an optional action. "box" is the dashed container for a whole list or
// page region, "inline" drops the border for use inside an existing panel.
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "box",
  className = "",
}) {
  const frame =
    variant === "box"
      ? "border border-dashed border-[var(--color-border-strong)] rounded-lg py-10 px-6"
      : "py-6";

  return (
    <div className={`flex flex-col items-center text-center ${frame} ${className}`}>
      {Icon && (
        <Icon aria-hidden="true" className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
      )}
      {title && <p className="text-sm font-medium">{title}</p>}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}