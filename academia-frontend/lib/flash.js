// Shared "bring this element to the user's attention" helper. Used by the
// best answer "View in list" control and by #answer-{id} deep links, so both
// scroll and flash the same way.

const timers = new WeakMap();

export function flashElement(el, duration = 1500) {
  clearTimeout(timers.get(el));
  el.classList.add("ring-2", "ring-accent");
  timers.set(
    el,
    setTimeout(() => el.classList.remove("ring-2", "ring-accent"), duration)
  );
}

export function scrollAndFlash(el) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  flashElement(el);
}