"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Patches history.pushState/replaceState once, globally, the moment this
// module is first loaded client-side. Next.js's App Router navigation, both
// <Link> clicks and any router.push()/replace() call anywhere in the app,
// goes through these same History API methods under the hood, so patching
// them here is the one place that catches every client-side navigation
// without touching any of the files that actually trigger one. Same
// underlying technique community packages like next-nprogress-bar use,
// reimplemented minimally here to avoid the dependency.
if (typeof window !== "undefined" && !window.__navProgressPatched) {
  window.__navProgressPatched = true;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args) => {
    const result = originalPushState(...args);
    // Deferred: Next's router internals call pushState/replaceState from
    // inside React's useInsertionEffect phase, which disallows scheduling
    // state updates synchronously. setTimeout(0) pushes our callback into
    // its own task, safely outside that phase, before it runs.
    setTimeout(() => window.__navProgressStart?.(), 0);
    return result;
  };
  window.history.replaceState = (...args) => {
    const result = originalReplaceState(...args);
    setTimeout(() => window.__navProgressStart?.(), 0);
    return result;
  };
  window.addEventListener("popstate", () => window.__navProgressStart?.());
}

const TRICKLE_INTERVAL_MS = 200;
const TRICKLE_CEILING = 90;
const SAFETY_TIMEOUT_MS = 6000; // force-complete if a "done" signal never arrives

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const runningRef = useRef(false);
  const trickleRef = useRef(null);
  const fadeRef = useRef(null);
  const safetyRef = useRef(null);

  function start() {
    if (runningRef.current) return; // already showing, let it keep trickling
    runningRef.current = true;

    clearTimeout(fadeRef.current);
    clearInterval(trickleRef.current);
    clearTimeout(safetyRef.current);

    setVisible(true);
    setProgress(8);

    trickleRef.current = setInterval(() => {
      setProgress((p) => (p >= TRICKLE_CEILING ? p : p + (TRICKLE_CEILING - p) * 0.1 + 1));
    }, TRICKLE_INTERVAL_MS);

    safetyRef.current = setTimeout(finish, SAFETY_TIMEOUT_MS);
  }

  function finish() {
    if (!runningRef.current) return;
    runningRef.current = false;

    clearInterval(trickleRef.current);
    clearTimeout(safetyRef.current);

    setProgress(100);
    fadeRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  }

  useEffect(() => {
    window.__navProgressStart = start;
    return () => {
      window.__navProgressStart = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pathname or search params changing is our "the new page actually
  // rendered" signal.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    return () => {
      clearInterval(trickleRef.current);
      clearTimeout(fadeRef.current);
      clearTimeout(safetyRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full bg-accent transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}