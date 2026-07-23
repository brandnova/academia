"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered, Code, Quote, Eye, Pencil } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

const ACTIONS = [
  { key: "bold", icon: Bold, before: "**", after: "**", placeholder: "bold text" },
  { key: "italic", icon: Italic, before: "_", after: "_", placeholder: "italic text" },
  { key: "strike", icon: Strikethrough, before: "~~", after: "~~", placeholder: "strikethrough" },
  { key: "link", icon: LinkIcon, before: "[", after: "](https://)", placeholder: "link text" },
  { key: "ul", icon: List, block: "-" },
  { key: "ol", icon: ListOrdered, block: "ol" },
  { key: "quote", icon: Quote, block: ">" },
  { key: "code", icon: Code, before: "`", after: "`", placeholder: "code", multilineBefore: "```\n", multilineAfter: "\n```" },
];

export default function MarkdownEditor({ value, onChange, placeholder, rows = 6 }) {
  const textareaRef = useRef(null);
  const [tab, setTab] = useState("write");

  function applyAction(action) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const hasSelection = selected.length > 0;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    if (action.block) {
      const text = hasSelection ? selected : "list item";
      const lines = text.split("\n");
      const newText = lines
        .map((line, i) => (action.block === "ol" ? `${i + 1}. ${line}` : `${action.block} ${line}`))
        .join("\n");
      onChange(`${before}${newText}${after}`);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionStart + newText.length);
      });
      return;
    }

    let insertBefore = action.before;
    let insertAfter = action.after;
    if (action.key === "code" && hasSelection && selected.includes("\n")) {
      insertBefore = action.multilineBefore;
      insertAfter = action.multilineAfter;
    }
    const text = hasSelection ? selected : action.placeholder;
    const inserted = `${insertBefore}${text}${insertAfter}`;
    onChange(`${before}${inserted}${after}`);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = selectionStart + insertBefore.length;
      textarea.setSelectionRange(cursorStart, cursorStart + text.length);
    });
  }

  return (
    <div className="my-3 overflow-hidden rounded border border-gray-300 dark:border-gray-600 transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-300 dark:border-gray-600 px-2 py-1">
        <div className="flex items-center gap-0.5">
          {ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => applyAction(action)}
              disabled={tab === "preview"}
              title={action.key}
              className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <action.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <div className="text-xs">
          <button
            type="button"
            onClick={() => setTab(tab === "write" ? "preview" : "write")}
            className="flex items-center gap-1 rounded px-2 py-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-accent dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {tab === "write" ? (
              <>
                <Eye className="h-3 w-3" />
                Preview
              </>
            ) : (
              <>
                <Pencil className="h-3 w-3" />
                Write
              </>
            )}
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="block w-full resize-y border-0 bg-white px-3 py-2 text-sm outline-none focus:outline-none dark:bg-gray-800"
        />
      ) : (
        <div className="px-3 py-2" style={{ minHeight: `${rows * 1.6}em` }}>
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-sm text-gray-400 italic">Nothing to preview yet.</p>
          )}
        </div>
      )}
      
    </div>
  );
}