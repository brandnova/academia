"use client";

import { useState, useRef, useEffect } from "react";

const DEFAULT_PANEL = "absolute top-full mt-1 right-0 w-48 py-1 text-sm";

export default function Dropdown({ trigger, children, panelClassName = DEFAULT_PANEL }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function toggle() {
    setOpen((prev) => !prev);
  }

  function close() {
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative inline-block">
      {trigger({ open, toggle })}
      {open && (
        <div
          className={`bg-white dark:bg-gray-800 border border-[var(--color-border)] rounded-lg shadow-lg z-50 ${panelClassName}`}
        >
          {typeof children === "function" ? children({ close, open }) : children}
        </div>
      )}
    </div>
  );
}