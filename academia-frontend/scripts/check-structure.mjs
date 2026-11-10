// Structure check. Run with: npm run check:structure
//
// 1. components/ and lib/ must not contain Next.js route files (page, layout,
//    route, ...). Next only treats app/ specially, so a route-shaped file
//    anywhere else is dead code that looks alive.
// 2. app/ must contain only Next.js special files. Components, helpers and
//    stale copies belong in components/ or lib/. Folders starting with "_"
//    are Next private folders and are skipped.
// 3. Every icon imported from lucide-react must exist in the installed
//    version, so a bad rename is caught here instead of at runtime.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, extname, basename, relative, sep } from "node:path";

const ROOT = process.cwd();
const CODE_EXTS = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ROUTE_FILE_NAMES = new Set([
  "page",
  "layout",
  "route",
  "loading",
  "error",
  "global-error",
  "not-found",
  "template",
  "default",
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
  "sitemap",
  "robots",
  "manifest",
]);

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const rel = (file) => relative(ROOT, file).split(sep).join("/");
const isCode = (file) => CODE_EXTS.has(extname(file));
const stem = (file) => basename(file, extname(file));

const appFiles = walk(join(ROOT, "app")).filter(isCode);
const componentFiles = walk(join(ROOT, "components")).filter(isCode);
const libFiles = walk(join(ROOT, "lib")).filter(isCode);

const problems = [];

for (const file of [...componentFiles, ...libFiles]) {
  if (ROUTE_FILE_NAMES.has(stem(file))) {
    problems.push(`${rel(file)}: route-shaped file outside app/, Next.js will never serve it`);
  }
}

for (const file of appFiles) {
  const parts = rel(file).split("/");
  if (parts.some((p) => p.startsWith("_"))) continue;
  if (!ROUTE_FILE_NAMES.has(stem(file))) {
    problems.push(`${rel(file)}: not a Next.js route file, move it to components/ or lib/`);
  }
}

const importRe = /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/g;
const usedIcons = new Map();
for (const file of [...appFiles, ...componentFiles, ...libFiles]) {
  const src = readFileSync(file, "utf8");
  for (const match of src.matchAll(importRe)) {
    for (const raw of match[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/)[0].trim();
      if (!name) continue;
      if (!usedIcons.has(name)) usedIcons.set(name, []);
      usedIcons.get(name).push(rel(file));
    }
  }
}

let iconNote = "icon check skipped";
try {
  const lucide = await import("lucide-react");
  const exported = new Set([...Object.keys(lucide), ...Object.keys(lucide.default ?? {})]);
  for (const [name, files] of usedIcons) {
    if (!exported.has(name)) {
      problems.push(`lucide-react has no icon "${name}" (used in ${files.join(", ")})`);
    }
  }
  iconNote = `${usedIcons.size} lucide icons verified`;
} catch (err) {
  console.warn(`Could not load lucide-react, skipping the icon check: ${err.message}`);
}

if (problems.length > 0) {
  console.error("Structure check failed:\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`Structure check passed (${iconNote}).`);