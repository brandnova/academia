"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import { questionUrl } from "@/lib/urls";
import { fieldErrorsFrom } from "@/lib/formErrors";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FormField, Input, Select } from "@/components/ui/FormControls";
import Skeleton from "@/components/ui/Skeleton";
import TagInput from "@/components/questions/TagInput";
import MarkdownEditor from "@/components/ui/MarkdownEditor";

export default function EditQuestionPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [question, setQuestion] = useState(null);
  const [hubDepartments, setHubDepartments] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [tags, setTags] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const load = useCallback(async () => {
    setLoadStatus("loading");
    try {
      const q = await clientFetch(`/questions/${id}/`);
      const hubData = await clientFetch(`/hubs/${q.hub.id}/`);
      setQuestion(q);
      setHubDepartments(hubData.departments ?? []);
      setTitle(q.title);
      setBody(q.body);
      setDepartmentId(q.department?.id || "");
      setTags(q.tags || []);
      setLoadStatus("ready");
    } catch {
      setLoadStatus("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError("");
    if (!body.trim()) {
      setFieldErrors({ body: "Body is required." });
      return;
    }
    setFieldErrors({});
    setSaveStatus("loading");
    try {
      const updated = await clientFetch(`/questions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          body,
          department_id: departmentId || null,
          tags,
        }),
      });
      router.push(questionUrl(updated));
    } catch (err) {
      setSaveStatus("error");
      const parsed = fieldErrorsFrom(err, {
        title: "title",
        body: "body",
        department: "department_id",
        tags: "tags",
      });
      setFieldErrors(parsed.fields);
      setGeneralError(parsed.general);
    }
  }

  if (authLoading || loadStatus === "loading") {
    return (
      <div className="space-y-3 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (loadStatus === "error") {
    return <ErrorMessage>Couldn't load this question.</ErrorMessage>;
  }

  if (!user || user.id !== question.author.id) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        You don't have permission to edit this question.
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Edit question</h1>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Title" error={fieldErrors.title}>
          {(field) => (
            <Input
              {...field}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          )}
        </FormField>

        <FormField label="Body" error={fieldErrors.body}>
          {(field) => (
            <MarkdownEditor
              {...field}
              value={body}
              onChange={setBody}
              placeholder="Describe your question in detail..."
              rows={6}
            />
          )}
        </FormField>

        {hubDepartments.length > 0 && (
          <FormField label="Department" error={fieldErrors.department}>
            {(field) => (
              <Select
                {...field}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">None</option>
                {hubDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        )}

        <FormField error={fieldErrors.tags}>
          {() => (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags</p>
              <TagInput value={tags} onChange={setTags} />
            </div>
          )}
        </FormField>

        <ErrorMessage>{generalError}</ErrorMessage>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saveStatus === "loading"}
            className="px-4 py-2 rounded bg-accent text-white text-sm disabled:opacity-50"
          >
            {saveStatus === "loading" ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border border-[var(--color-border-strong)] text-sm"
            onClick={() => router.push(questionUrl(question))}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}