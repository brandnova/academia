const SIZES = {
  "2xs": "text-[11px]",
  xs: "text-xs",
  sm: "text-sm",
};

const TONES = {
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-700 dark:text-amber-400",
};

// One place for every inline error or warning line. Renders nothing when
// there is no message, so callers can pass the state straight in without a
// conditional. role="alert" makes screen readers announce it when it appears.
export default function ErrorMessage({ children, size = "sm", tone = "error", className = "", id }) {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className={`${TONES[tone] ?? TONES.error} ${SIZES[size] ?? SIZES.sm} ${className}`}
    >
      {children}
    </p>
  );
}