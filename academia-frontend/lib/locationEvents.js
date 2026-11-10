// Next's App Router changes the URL with history.pushState and replaceState.
// Those never fire hashchange or popstate, so a <Link> click that only
// changes the #hash is invisible to listeners. This patches both methods once
// and announces every change as an "app:locationchange" event. It chains
// safely with the patch NavigationProgressBar already applies, each wrapper
// calls whatever was there before it.

export const LOCATION_EVENT = "app:locationchange";

if (typeof window !== "undefined" && !window.__locationEventsPatched) {
  window.__locationEventsPatched = true;

  for (const method of ["pushState", "replaceState"]) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args) => {
      const result = original(...args);
      // Deferred, Next calls these from inside React's insertion effect
      // phase, and listeners should run after the commit, not during it.
      setTimeout(() => window.dispatchEvent(new Event(LOCATION_EVENT)), 0);
      return result;
    };
  }
}