"use client";

import { useEffect } from "react";
import { scrollAndFlash } from "@/lib/flash";
import { LOCATION_EVENT } from "@/lib/locationEvents";

// Renders nothing. When the URL carries #answer-{id}, scrolls that answer to
// the middle of the screen and flashes it, on first load and on every later
// hash change, including a <Link> click that stays on this same page. Comments
// load lazily per answer, so landing on the answer is the goal, the thread is
// not opened.
export default function AnswerHashFlash() {
  useEffect(() => {
    function flashFromHash() {
      const id = window.location.hash.slice(1);
      if (!id.startsWith("answer-")) return;
      const el = document.getElementById(id);
      if (el) scrollAndFlash(el);
    }

    flashFromHash();
    window.addEventListener("hashchange", flashFromHash);
    window.addEventListener("popstate", flashFromHash);
    window.addEventListener(LOCATION_EVENT, flashFromHash);
    return () => {
      window.removeEventListener("hashchange", flashFromHash);
      window.removeEventListener("popstate", flashFromHash);
      window.removeEventListener(LOCATION_EVENT, flashFromHash);
    };
  }, []);

  return null;
}