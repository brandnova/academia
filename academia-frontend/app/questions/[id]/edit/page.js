"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/clientApi";
import { useAuth } from "@/lib/auth-context";
import Skeleton from "@/components/ui/Skeleton";
import TagInput from "@/components/questions/TagInput";

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
  const [errorMsg, setErrorMsg] = useState("");

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
    setSaveStatus("loading");
    setErrorMsg("");
    try {
      await clientFetch(`/questions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          body,
          department_id: departmentId || null,
          tags,
        }),
      });
      router.push(`/questions/${id}`);
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg(err.message);
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
    return <p className="text-red-600 dark:text-red-400">Couldn't load this question.</p>;
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
        {hubDepartments.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">None</option>
              {hubDepartments.map((d) => (
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
        {saveStatus === "error" && (
          <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>
        )}
        <button
          type="submit"
          disabled={saveStatus === "loading"}
          className="px-4 py-2 rounded bg-accent text-white text-sm disabled:opacity-50"
        >
          {saveStatus === "loading" ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}