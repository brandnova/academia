"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import SchoolPicker from "@/components/questions/SchoolPicker";
import TagInput from "@/components/questions/TagInput";

function AskQuestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledHubId = searchParams.get("hub");
  const { user, loading: authLoading } = useAuth();

  const [hub, setHub] = useState(null);
  const [hubLoadStatus, setHubLoadStatus] = useState(prefilledHubId ? "loading" : "idle");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [tags, setTags] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const loadHubById = useCallback(async (hubId) => {
    setHubLoadStatus("loading");
    try {
      const data = await clientFetch(`/hubs/${hubId}/`);
      setHub(data);
      setHubLoadStatus("ready");
    } catch {
      // Bad or stale ?hub= param: fall back to the picker instead of a dead end
      setHub(null);
      setHubLoadStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (prefilledHubId) loadHubById(prefilledHubId);
  }, [prefilledHubId, loadHubById]);

  async function handleSelectSchool(school) {
    setHubLoadStatus("loading");
    setErrorMsg("");
    try {
      const data = await clientFetch(`/hubs/by-school/${school.id}/`);
      setHub(data);
      setHubLoadStatus("ready");
    } catch (err) {
      setHubLoadStatus("idle");
      setErrorMsg(err.message);
    }
  }

  function handleChangeSchool() {
    setHub(null);
    setDepartmentId("");
    setHubLoadStatus("idle");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
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
      router.push(`/questions/${question.id}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  if (authLoading) return <p className="text-gray-500">Loading...</p>;

  if (!user) {
    return (
      <p className="text-gray-500 dark:text-gray-400">You need to log in to ask a question.</p>
    );
  }

  if (hubLoadStatus === "loading") return <p className="text-gray-500">Loading...</p>;

  if (!hub) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold mb-1">Ask a question</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Which school is this about?
        </p>
        <SchoolPicker onSelect={handleSelectSchool} />
        {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm mt-3">{errorMsg}</p>}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
        {hub.departments?.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Department (optional)
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">None</option>
              {hub.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tags</label>
          <TagInput value={tags} onChange={setTags} />
        </div>
        {status === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
        )}
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