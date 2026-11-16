"use client";

import { useState } from "react";
import { clientFetch } from "@/lib/clientApi";
import { fieldErrorsFrom } from "@/lib/formErrors";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FormField, Input } from "@/components/ui/FormControls";

export default function DepartmentForm({ schoolId, onCreated }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setFieldErrors({});
    setGeneralError("");
    try {
      const dept = await clientFetch(`/schools/${schoolId}/departments/`, {
        method: "POST",
        body: JSON.stringify({ name, code: code || undefined }),
      });
      onCreated(dept);
      setName("");
      setCode("");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      setStatus("error");
      if (err.status === 403) {
        setGeneralError("You don't have permission to add departments for this school.");
        return;
      }
      const parsed = fieldErrorsFrom(err, { name: "name", code: "code" });
      setFieldErrors(parsed.fields);
      setGeneralError(parsed.general);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-3 mb-6">
      <FormField label="Name" error={fieldErrors.name} className="flex-1 min-w-[160px]">
        {(field) => (
          <Input
            {...field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
      </FormField>
      <FormField label="Code" error={fieldErrors.code} className="w-28">
        {(field) => (
          <Input {...field} value={code} onChange={(e) => setCode(e.target.value)} />
        )}
      </FormField>
      <div>
        {/* Same height as the labels beside it, so the button lines up with the
            inputs whether or not an error is showing under them. */}
        <span aria-hidden="true" className="block text-xs mb-1 invisible">
          Add
        </span>
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 rounded bg-accent text-white text-sm disabled:opacity-50"
        >
          {status === "loading" ? "Adding..." : "Add department"}
        </button>
      </div>
      <ErrorMessage className="w-full">{generalError}</ErrorMessage>
      {status === "success" && (
        <p role="status" className="text-success dark:text-success-dark text-sm w-full">
          Added.
        </p>
      )}
    </form>
  );
}