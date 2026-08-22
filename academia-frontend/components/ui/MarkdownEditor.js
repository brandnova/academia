"use client";

import { useRef, useState } from "react";
import {
  Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered,
  Code, Quote, Eye, Pencil, Heading1, Heading2, Heading3,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

const HEADING_ACTIONS = [
  { key: "h1", icon: Heading1, heading: "#" },
  { key: "h2", icon: Heading2, heading: "##" },
  { key: "h3", icon: Heading3, heading: "###" },
];

const ACTIONS = [
  { key: "bold", icon: Bold, before: "**", after: "**", placeholder: "bold text", shortcut: "b" },
  { key: "italic", icon: Italic, before: "_", after: "_", placeholder: "italic text", shortcut: "i" },
  { key: "strike", icon: Strikethrough, before: "~~", after: "~~", placeholder: "strikethrough" },
  { key: "link", icon: LinkIcon, before: "[", after: "](https://)", placeholder: "link text", shortcut: "k" },
  { key: "ul", icon: List, block: "-" },
  { key: "ol", icon: ListOrdered, block: "ol" },
  { key: "quote", icon: Quote, block: ">" },
  { key: "code", icon: Code, before: "`", after: "`", placeholder: "code", multilineBefore: "```\n", multilineAfter: "\n```" },
];

export default function MarkdownEditor({ value, onChange, placeholder, rows = 6, richMode = false }) {
  const textareaRef = useRef(null);
  const [preview, setPreview] = useState(false);

  const allActions = richMode ? [...HEADING_ACTIONS, ...ACTIONS] : ACTIONS;

  function applyAction(action) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const hasSelection = selected.length > 0;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    // Headings: replace or strip the leading #'s on the current line,
    // clicking the same level again toggles it back to a plain paragraph.
    if (action.heading) {
      const lineStart = before.lastIndexOf("\n") + 1;
      const relEnd = after.indexOf("\n");
      const lineEnd = relEnd === -1 ? value.length : selectionEnd + relEnd;
      const fullLine = value.slice(lineStart, lineEnd);
      const match = fullLine.match(/^(#{1,6})\s+(.*)$/);
      let newLine;
      if (match && match[1] === action.heading) {
        newLine = match[2];
      } else if (match) {
        newLine = `${action.heading} ${match[2]}`;
      } else {
        newLine = `${action.heading} ${fullLine}`;
      }
      const newValue = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = lineStart + newLine.length;
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    // Lists / quote: prefix each selected line
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

    // Toggle off: the selection itself is exactly "**text**"
    if (
      hasSelection &&
      selected.startsWith(action.before) &&
      selected.endsWith(action.after) &&
      selected.length >= action.before.length + action.after.length
    ) {
      const inner = selected.slice(action.before.length, selected.length - action.after.length);
      onChange(`${before}${inner}${after}`);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionStart + inner.length);
      });
      return;
    }

    // Toggle off: cursor/selection sits directly inside existing markers,
    // clicking the same button again with your cursor inside **|** removes
    // them instead of nesting a second pair
    const beforeSlice = before.slice(-action.before.length);
    const afterSlice = after.slice(0, action.after.length);
    if (beforeSlice === action.before && afterSlice === action.after) {
      const newBefore = before.slice(0, before.length - action.before.length);
      const newAfter = after.slice(action.after.length);
      onChange(`${newBefore}${selected}${newAfter}`);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newBefore.length, newBefore.length + selected.length);
      });
      return;
    }

    // Default: wrap with formatting
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

  function handleKeyDown(e) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Cmd/Ctrl+B, I, K
    if (e.metaKey || e.ctrlKey) {
      const action = ACTIONS.find((a) => a.shortcut === e.key.toLowerCase());
      if (action) {
        e.preventDefault();
        applyAction(action);
        return;
      }
    }

    if (e.key !== "Enter" || e.shiftKey) return;

    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart !== selectionEnd) return; // let default happen on a real selection

    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionStart);
    const lineStart = before.lastIndexOf("\n") + 1;
    const currentLine = before.slice(lineStart);
    const match = currentLine.match(/^(\s*)([-*+]|\d+\.)\s(.*)$/);
    if (!match) return; // not inside a list, normal Enter behavior

    e.preventDefault();
    const [, indent, marker, content] = match;

    if (content.trim() === "") {
      // Empty list item: exit the list instead of continuing it
      const newValue = value.slice(0, lineStart) + indent + after;
      onChange(newValue);
      const pos = lineStart + indent.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(pos, pos);
      });
      return;
    }

    const nextMarker = /^\d+\.$/.test(marker) ? `${parseInt(marker, 10) + 1}.` : marker;
    const insertion = `\n${indent}${nextMarker} `;
    onChange(`${before}${insertion}${after}`);
    const pos = selectionStart + insertion.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="my-3 border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-gray-300 dark:border-gray-600 px-2 py-1">
        <div className="flex items-center gap-0.5">
          {allActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => applyAction(action)}
              disabled={preview}
              title={action.key}
              className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <action.icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-accent transition-colors"
        >
          {preview ? <Pencil className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {preview ? "Write" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="px-3 py-2 bg-white dark:bg-gray-800" style={{ minHeight: `${rows * 1.6}em` }}>
          {value.trim() ? (
            <MarkdownRenderer content={value} allowHeadings={richMode} />
          ) : (
            <p className="text-sm text-gray-400 italic">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className="w-full block resize-y px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none"
        />
      )}
    </div>
  );
}