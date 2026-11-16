// One-off codemod: moves the app onto the shared primitives.
//
//   node scripts/codemod-primitives.mjs           dry run, prints what would change
//   node scripts/codemod-primitives.mjs --write   applies it
//
// 1. Red or amber error paragraphs become <ErrorMessage>.
// 2. Raw <input>, <select> and <textarea> that carry the app's standard control
//    styling become <Input>, <Select> and <Textarea>.
//
// It only touches code it recognises exactly and lists everything it skips, so
// review the skips and the git diff. It restyles controls, it does not wire
// labels to them. Use FormField for that by hand.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";

const WRITE = process.argv.includes("--write");
const ROOT = process.cwd();
const SKIP = new Set(["components/ui/ErrorMessage.js", "components/ui/FormControls.js"]);

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (extname(full) === ".js") out.push(full);
  }
  return out;
}

const rel = (file) => relative(ROOT, file).split(sep).join("/");
const lineOf = (src, index) => src.slice(0, index).split("\n").length;

// ---------- import handling ----------

function insertAfterImports(src, line) {
  const importRe = /^import[\s\S]*?from\s+["'][^"']+["'];?[ \t]*\r?\n/gm;
  let last = null;
  let m;
  while ((m = importRe.exec(src))) last = m;
  if (!last) return `${line}\n${src}`;
  const at = last.index + last[0].length;
  return src.slice(0, at) + line + "\n" + src.slice(at);
}

function ensureErrorMessageImport(src) {
  if (/import\s+ErrorMessage\s+from\s+["']@\/components\/ui\/ErrorMessage["']/.test(src)) return src;
  return insertAfterImports(src, 'import ErrorMessage from "@/components/ui/ErrorMessage";');
}

function ensureControlImports(src, names) {
  const existing = src.match(/import\s*\{([^}]*)\}\s*from\s*["']@\/components\/ui\/FormControls["'];?/);
  if (existing) {
    const have = existing[1].split(",").map((s) => s.trim()).filter(Boolean);
    const merged = [...new Set([...have, ...names])].sort();
    return src.replace(existing[0], `import { ${merged.join(", ")} } from "@/components/ui/FormControls";`);
  }
  const sorted = [...names].sort();
  return insertAfterImports(src, `import { ${sorted.join(", ")} } from "@/components/ui/FormControls";`);
}

// ---------- 1. error paragraphs ----------

function convertErrors(src, file, report) {
  let count = 0;
  const out = src.replace(/<p className="([^"]*)">([\s\S]*?)<\/p>/g, (match, cls, children, offset) => {
    const tokens = cls.trim().split(/\s+/);
    const isError = tokens.includes("text-red-600") && tokens.includes("dark:text-red-400");
    const isWarning =
      (tokens.includes("text-amber-600") || tokens.includes("text-amber-700")) &&
      tokens.includes("dark:text-amber-400");
    if (!isError && !isWarning) return match;

    let size = null;
    if (tokens.includes("text-xs")) size = "xs";
    else if (tokens.includes("text-sm")) size = "sm";
    else if (tokens.includes("text-[11px]")) size = "2xs";
    if (!size) {
      report.skipped.push(`${file}:${lineOf(src, offset)} error paragraph without a text size class`);
      return match;
    }

    const drop = new Set([
      "text-red-600", "dark:text-red-400", "text-amber-600", "text-amber-700", "dark:text-amber-400",
      "text-xs", "text-sm", "text-[11px]",
    ]);
    const rest = tokens.filter((t) => !drop.has(t)).join(" ");
    const attrs = [
      size !== "sm" ? ` size="${size}"` : "",
      isWarning ? ' tone="warning"' : "",
      rest ? ` className="${rest}"` : "",
    ].join("");
    count += 1;
    return `<ErrorMessage${attrs}>${children}</ErrorMessage>`;
  });
  report.errors += count;
  return count ? ensureErrorMessageImport(out) : src;
}

// ---------- 2. form controls ----------

// End index of the opening tag that starts at `start`, ignoring the > inside
// arrow functions and other expressions.
function findTagEnd(src, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return i;
  }
  return -1;
}

const BASE = ["rounded", "border", "border-[var(--color-border-strong)]", "bg-white", "dark:bg-gray-800"];
const SIZE_RULES = [
  { size: "md", need: ["px-3", "py-2", "text-sm"] },
  { size: "sm", need: ["px-2", "py-1.5", "text-sm"] },
  { size: "sm", need: ["px-2", "py-1", "text-sm"] },
  { size: "xs", need: ["px-2", "py-1", "text-xs"] },
  { size: "lg", need: ["px-2", "py-1", "text-lg", "font-semibold"] },
];
const PRIMITIVE_OWNED = ["w-full", "disabled:opacity-50", "resize-y"];

function convertOpening(tag, name) {
  if (/\btype="(checkbox|radio|file|hidden|range)"/.test(tag)) return { silent: true };
  const classMatch = tag.match(/className="([^"]*)"/);
  if (!classMatch) {
    return /className=\{/.test(tag)
      ? { reason: "dynamic className" }
      : { silent: true };
  }
  const tokens = classMatch[1].trim().split(/\s+/);
  if (!BASE.every((t) => tokens.includes(t))) return { reason: "not the standard control styling" };
  const rule = SIZE_RULES.find((r) => r.need.every((t) => tokens.includes(t)));
  if (!rule) return { reason: "unfamiliar padding or text size" };

  const consumed = new Set([...BASE, ...rule.need, ...PRIMITIVE_OWNED]);
  const rest = tokens.filter((t) => !consumed.has(t)).join(" ");
  const attrs = [
    rule.size !== "md" ? `size="${rule.size}"` : "",
    tokens.includes("w-full") ? "" : "fullWidth={false}",
    rest ? `className="${rest}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const component = name[0].toUpperCase() + name.slice(1);
  const replaced = tag
    .replace(/(\s*)className="[^"]*"/, (_, ws) => (attrs ? `${ws || " "}${attrs}` : ""))
    .replace(`<${name}`, `<${component}`);
  return { ok: true, replaced, component, selfClosing: /\/\s*>$/.test(tag) };
}

function convertControls(src, file, report) {
  const edits = [];
  const used = new Set();
  const re = /<(input|select|textarea)\b/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    const end = findTagEnd(src, m.index);
    if (end === -1) continue;
    const tag = src.slice(m.index, end + 1);
    const result = convertOpening(tag, name);
    if (!result.ok) {
      if (!result.silent) report.skipped.push(`${file}:${lineOf(src, m.index)} <${name}> ${result.reason}`);
      continue;
    }
    edits.push({ start: m.index, end: end + 1, text: result.replaced });
    used.add(result.component);
    if (!result.selfClosing && name !== "input") {
      const closeTag = `</${name}>`;
      const closeAt = src.indexOf(closeTag, end);
      if (closeAt !== -1) {
        edits.push({ start: closeAt, end: closeAt + closeTag.length, text: `</${result.component}>` });
      }
    }
  }
  if (!edits.length) return src;
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  report.controls += used.size ? edits.filter((e) => !e.text.startsWith("</")).length : 0;
  return ensureControlImports(out, [...used]);
}

// ---------- run ----------

const files = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))].filter(
  (f) => !SKIP.has(rel(f))
);
const totals = { errors: 0, controls: 0, files: 0 };
const skipped = [];

for (const file of files) {
  const name = rel(file);
  const original = readFileSync(file, "utf8");
  const report = { errors: 0, controls: 0, skipped };
  let next = convertErrors(original, name, report);
  next = convertControls(next, name, report);
  if (next !== original) {
    totals.files += 1;
    totals.errors += report.errors;
    totals.controls += report.controls;
    console.log(`${WRITE ? "updated" : "would update"} ${name}  (errors ${report.errors}, controls ${report.controls})`);
    if (WRITE) writeFileSync(file, next);
  }
}

console.log(
  `\n${WRITE ? "Updated" : "Would update"} ${totals.files} files: ${totals.errors} error messages, ${totals.controls} controls.`
);
if (skipped.length) {
  console.log(`\nSkipped, left as they were (${skipped.length}):`);
  for (const s of skipped) console.log(`  - ${s}`);
}
if (!WRITE) console.log("\nDry run. Re-run with --write to apply.");