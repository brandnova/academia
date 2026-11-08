"use client";

import { useId } from "react";
import ErrorMessage from "./ErrorMessage";

const SIZES = {
  lg: "px-2 py-1 text-lg font-semibold",
  md: "px-3 py-2 text-sm",
  sm: "px-2 py-1.5 text-sm",
  xs: "px-2 py-1 text-xs",
};

function controlClasses({ size, fullWidth, invalid, className, extra = "" }) {
  return [
    "rounded border bg-white dark:bg-gray-800 disabled:opacity-50",
    invalid ? "border-red-500" : "border-[var(--color-border-strong)]",
    SIZES[size] ?? SIZES.md,
    fullWidth ? "w-full" : "",
    extra,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Input({ size = "md", fullWidth = true, invalid = false, className = "", ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={controlClasses({ size, fullWidth, invalid, className })}
      {...props}
    />
  );
}

export function Select({ size = "md", fullWidth = true, invalid = false, className = "", ...props }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={controlClasses({ size, fullWidth, invalid, className })}
      {...props}
    />
  );
}

export function Textarea({ size = "md", fullWidth = true, invalid = false, className = "", ...props }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={controlClasses({ size, fullWidth, invalid, className, extra: "resize-y" })}
      {...props}
    />
  );
}

// Usage:
//   <FormField label="Name" hint="Shown on your posts" error={fieldError}>
//     {(field) => <Input {...field} value={name} onChange={(e) => setName(e.target.value)} />}
//   </FormField>
// `field` carries id, aria-describedby and invalid, which Input, Select and
// Textarea all understand. Without a label, give the control an aria-label.
export function FormField({ label, hint, error, className = "", children }) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      {children({
        id,
        "aria-describedby": describedBy || undefined,
        invalid: Boolean(error),
      })}
      {hint && (
        <p id={hintId} className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {hint}
        </p>
      )}
      <ErrorMessage id={errorId} size="xs" className="mt-1">
        {error}
      </ErrorMessage>
    </div>
  );
}