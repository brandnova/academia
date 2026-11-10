"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { clientFetch } from "@/lib/clientApi";
import { FormField, Input } from "@/components/ui/FormControls";
import Tabs from "@/components/ui/Tabs";
import ActivityFeed from "@/components/profile/ActivityFeed";
import QuestionsTab from "@/components/profile/QuestionsTab";
import AnswersTab from "@/components/profile/AnswersTab";
import CommentsTab from "@/components/profile/CommentsTab";

const TABS = [
  { key: "activity", label: "Activity" },
  { key: "questions", label: "Questions" },
  { key: "answers", label: "Answers" },
  { key: "comments", label: "Comments" },
];

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle");
  const [fieldError, setFieldError] = useState("");
  const [tab, setTab] = useState("activity");
  // A tab mounts the first time it is opened and then stays mounted (hidden),
  // so coming back keeps its loaded pages and scroll position.
  const [visited, setVisited] = useState(() => new Set(["activity"]));

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (!user) {
    return <p className="text-gray-500 dark:text-gray-400">You need to log in to view this page.</p>;
  }

  const isModerator = (user.moderator_for?.length ?? 0) > 0;
  const isRepresentative = (user.representative_for?.length ?? 0) > 0;
  const hasModerationAccess = isModerator || isRepresentative;

  const stats = [
    ["Questions", user.stats?.question_count ?? 0],
    ["Answers", user.stats?.answer_count ?? 0],
    ["Best answers", user.stats?.best_answer_count ?? 0],
    ["Comments", user.stats?.comment_count ?? 0],
  ];

  function selectTab(key) {
    setTab(key);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  function startEditing() {
    setName(user.full_name);
    setFieldError("");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setFieldError("");
  }

  async function saveName(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Name can't be blank.");
      return;
    }
    if (trimmed === user.full_name) {
      cancelEditing();
      return;
    }
    setStatus("loading");
    setFieldError("");
    try {
      await clientFetch("/users/me/", {
        method: "PATCH",
        body: JSON.stringify({ full_name: trimmed }),
      });
      await refreshUser();
      setEditing(false);
      setStatus("idle");
    } catch (err) {
      // The backend answers a blank or too long name with a field error.
      setStatus("error");
      setFieldError(err.message);
    }
  }

  function renderPanel(key) {
    if (key === "activity") return <ActivityFeed userId={user.id} />;
    if (key === "questions") return <QuestionsTab userId={user.id} />;
    if (key === "answers") return <AnswersTab />;
    return <CommentsTab />;
  }

  return (
    <div className="max-w-2xl">
      <section className="border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
        <div className="flex items-start gap-4 p-4 sm:p-5">
          {user.avatar ? (
            // A plain <img> on purpose: Google serves the picture from its own
            // CDN at the right size, and next/image would need remotePatterns
            // set up for a small avatar. alt is empty because the name is shown
            // right beside it. no-referrer stops Google rejecting the request.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt=""
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-[var(--color-border)] shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xl sm:text-2xl font-semibold shrink-0"
            >
              {user.full_name?.[0]?.toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {editing ? (
              <form
                onSubmit={saveName}
                noValidate
                className="flex flex-col sm:flex-row sm:items-start gap-2"
              >
                <FormField error={fieldError} className="sm:min-w-[16rem]">
                  {(field) => (
                    <Input
                      {...field}
                      size="lg"
                      aria-label="Your name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldError) setFieldError("");
                      }}
                    />
                  )}
                </FormField>
                <div className="flex gap-3 sm:pt-1.5">
                  <button
                    type="submit"
                    disabled={status === "loading" || !name.trim()}
                    className="text-sm text-accent disabled:opacity-50"
                  >
                    {status === "loading" ? "Saving..." : "Save"}
                  </button>
                  <button type="button" onClick={cancelEditing} className="text-sm text-gray-400">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <h1 className="text-xl font-semibold truncate">{user.full_name}</h1>
                <button
                  onClick={startEditing}
                  aria-label="Edit name"
                  className="shrink-0 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-accent transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user.email}</p>

            {(user.is_admin || hasModerationAccess) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {user.is_admin && (
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">Admin</span>
                )}
                {isModerator && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Moderator
                  </span>
                )}
                {isRepresentative && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Representative
                  </span>
                )}
                {hasModerationAccess && (
                  <Link
                    href="/moderation"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Moderation tools
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-4 divide-x divide-[var(--color-border)] border-t border-[var(--color-border)]">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse items-center px-1 py-3 text-center">
              <dt className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Tabs
        tabs={TABS}
        value={tab}
        onChange={selectTab}
        idBase="profile"
        ariaLabel="Your activity and posts"
      />

      {TABS.map(
        ({ key }) =>
          visited.has(key) && (
            <div
              key={key}
              role="tabpanel"
              id={`profile-panel-${key}`}
              aria-labelledby={`profile-tab-${key}`}
              hidden={tab !== key}
              className="pt-4"
            >
              {renderPanel(key)}
            </div>
          )
      )}
    </div>
  );
}