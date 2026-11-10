"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import { questionUrl } from "@/lib/urls";
import { fieldErrorsFrom } from "@/lib/formErrors";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { FormField, Input, Select } from "@/components/ui/FormControls";
import SchoolPicker from "@/components/questions/SchoolPicker";
import TagInput from "@/components/questions/TagInput";
import MarkdownEditor from "@/components/ui/MarkdownEditor";

function AskQuestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledHubId = searchParams.get("hub");
  const { user, loading: authLoading } = useAuth();

  const [hub, setHub] = useState(null);
  const [prefillStatus, setPrefillStatus] = useState(prefilledHubId ? "loading" : "idle");
  const [selectingId, setSelectingId] = useState(null);
  const [pickNotice, setPickNotice] = useState(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("idle");
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const loadHubById = useCallback(async (hubId) => {
    setPrefillStatus("loading");
    try {
      const data = await clientFetch(`/hubs/${hubId}/`);
      setHub(data);
    } catch {
      // Bad or stale ?hub= param: fall back to the picker instead of a dead end
      setHub(null);
    } finally {
      setPrefillStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (prefilledHubId) loadHubById(prefilledHubId);
  }, [prefilledHubId, loadHubById]);

  async function handleSelectSchool(school) {
    if (selectingId) return;
    setPickNotice(null);
    setSelectingId(school.id);
    try {
      const data = await clientFetch(`/hubs/by-school/${school.id}/`);
      setHub(data);
    } catch (err) {
      setPickNotice({ schoolId: school.id, tone: "error", text: err.message });
    } finally {
      setSelectingId(null);
    }
  }

  function handleChangeSchool() {
    setHub(null);
    setDepartmentId("");
    setFieldErrors({});
    setGeneralError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError("");
    if (!body.trim()) {
      setFieldErrors({ body: "Body is required." });
      return;
    }
    setFieldErrors({});
    setStatus("loading");
    try {
      const question = await clientFetch("/questions/", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          hub_id: hub.id,
          department_id: departmentId || undefined,
          tags,
        }),
      });
      router.push(questionUrl(question));
    } catch (err) {
      setStatus("error");
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

  if (authLoading || prefillStatus === "loading") return <p className="text-gray-500">Loading...</p>;

  if (!user) {
    return (
      <p className="text-gray-500 dark:text-gray-400">You need to log in to ask a question.</p>
    );
  }

  if (!hub) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold mb-1">Ask a question</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Which school is this about?
        </p>
        <SchoolPicker onSelect={handleSelectSchool} notice={pickNotice} busyId={selectingId} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">Ask a question</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Posting to {hub.school.name}{" "}
        <button
          type="button"
          onClick={handleChangeSchool}
          className="text-accent hover:underline"
        >
          (change school)
        </button>
      </p>

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

        {hub.departments?.length > 0 && (
          <FormField label="Department (optional)" error={fieldErrors.department}>
            {(field) => (
              <Select
                {...field}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">None</option>
                {hub.departments.map((d) => (
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
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-4 py-2 rounded bg-accent text-white text-sm disabled:opacity-50"
        >
          {status === "loading" ? "Posting..." : "Post question"}
        </button>
      </form>
    </div>
  );
}

export default function AskQuestionPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
      <AskQuestionForm />
    </Suspense>
  );
}