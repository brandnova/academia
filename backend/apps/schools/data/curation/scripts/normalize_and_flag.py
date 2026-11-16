#!/usr/bin/env python3
"""
Academia school-directory data prep, stage 1: normalize + flag.

Reads the 11 raw NUC/NBTE/NCCE source files, parses each into one common
row shape, and produces:

  1. schools_normalized.csv  - every parsed institution, one row each
  2. flags_report.csv        - every row/pair flagged for manual review

Nothing is deduplicated, merged, or dropped automatically. This is a
first honest pass: normalize the shape, surface likely problems, let a
human decide. short_name is NOT generated here, that's a later step.
"""

import csv
import re
import sys
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

# ---------------------------------------------------------------------------
# CONFIG - edit this if your folder is named or located differently
# ---------------------------------------------------------------------------
INPUT_DIR = Path("Nig. Tertiary Institutions")
OUTPUT_NORMALIZED = Path("schools_normalized.csv")
OUTPUT_FLAGS = Path("flags_report.csv")

NIGERIAN_STATES = {
    "abia", "adamawa", "akwa ibom", "anambra", "bauchi", "bayelsa", "benue",
    "borno", "cross river", "delta", "ebonyi", "edo", "ekiti", "enugu",
    "gombe", "imo", "jigawa", "kaduna", "kano", "katsina", "kebbi", "kogi",
    "kwara", "lagos", "nasarawa", "niger", "ogun", "ondo", "osun", "oyo",
    "plateau", "rivers", "sokoto", "taraba", "yobe", "zamfara", "fct",
    "abuja",
}

STATE_ALIASES = {
    "abuja": "FCT",
    "fct": "FCT",
}

# words too generic to use as a fuzzy-match "signature" word
STOPWORDS = {
    "federal", "state", "private", "university", "polytechnic", "college",
    "of", "education", "and", "the", "technology", "science", "technical",
    "institute", "allied", "institution", "health", "nursing", "agriculture",
    "general", "studies", "for", "in", "at", "national", "school", "advanced",
    "nigeria", "nigerian",
}

FILES = [
    # (filename, regulator, forced_institution_type, ownership_from_filename)
    ("(NUC) FEDERAL UNIVERSITIES.md", "NUC", "UNIVERSITY", "FEDERAL"),
    ("(NUC) STATE UNIVERSITIES.md", "NUC", "UNIVERSITY", "STATE"),
    ("(NUC) PRIVATE UNIVERSITIES.md", "NUC", "UNIVERSITY", "PRIVATE"),
    ("(NBTE) FEDERAL POLYTECHNICS.md", "NBTE", "POLYTECHNIC", "FEDERAL"),
    ("(NBTE) STATE POLYTECHNICS.md", "NBTE", "POLYTECHNIC", "STATE"),
    ("(NBTE) PRIVATE POLYTECHNICS.md", "NBTE", "POLYTECHNIC", "PRIVATE"),
    ("(NBTE) UNCATEGORIZED POLYTECHNICS.md", "NBTE", "POLYTECHNIC", None),
    ("(NBTE) ALLIED INSTITUTIONS.md", "NBTE", "POLYTECHNIC", None),
    ("(NBTE) COLLEGES OF HEALTH TECH.md", "NBTE", "POLYTECHNIC", None),
    ("(NBTE) COLLEGES OF NURSING.md", "NBTE", "POLYTECHNIC", None),
    ("(NCCE) COLLEGES OF EDUCATION.md", "NCCE", "COLLEGE_OF_EDUCATION", None),
]

UPGRADE_RE = re.compile(r"\(Now\s+(.+?)\)\s*$", re.IGNORECASE)


def clean_text(value):
    if value is None:
        return None
    value = value.replace("\u2019", "'").replace("\u2018", "'")
    value = value.strip()
    return value or None


def strip_upgrade_annotation(name):
    """Returns (cleaned_name, upgraded_to_or_None)."""
    match = UPGRADE_RE.search(name)
    if not match:
        return name.strip(), None
    upgraded_to = match.group(1).strip()
    cleaned = UPGRADE_RE.sub("", name).strip().rstrip(",")
    return cleaned, upgraded_to


def normalize_for_matching(name):
    name = name.lower()
    name = name.replace("'", "").replace(",", " ").replace(".", " ")
    name = re.sub(r"\s+", " ", name).strip()
    return name


def guess_state_from_name(name):
    """Best-effort: check the trailing comma-separated fragment against a
    known Nigerian state list. Returns None if nothing matches, never
    guesses a city."""
    parts = [p.strip() for p in name.split(",") if p.strip()]
    if len(parts) < 2:
        return None
    tail = parts[-1].lower()
    tail = STATE_ALIASES.get(tail, tail)
    if tail.lower() in NIGERIAN_STATES:
        return "FCT" if tail.lower() == "fct" else tail.title()
    return None


def parse_tab_row(line):
    return [clean_text(f) for f in line.rstrip("\n").split("\t")]


# ---------------------------------------------------------------------------
# Per-source parsers. Each yields dicts in the common row shape.
# ---------------------------------------------------------------------------

def parse_nuc_file(path, ownership_from_filename):
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        fields = parse_tab_row(line)
        if not fields or fields[0] is None:
            continue
        if fields[0].strip().upper() in ("S/N", "S/NO"):
            continue  # header
        source_row_number = fields[0]
        name = fields[1] if len(fields) > 1 else None
        vc = fields[2] if len(fields) > 2 else None
        website = fields[3] if len(fields) > 3 else None
        year = fields[4] if len(fields) > 4 else None
        if not name:
            continue
        rows.append({
            "raw_name": name,
            "vc_or_provost": vc,
            "website": website,
            "year_established": year,
            "ownership": ownership_from_filename,
            "state": None,  # NUC files don't carry state, backfilled below
            "raw_category": f"{ownership_from_filename.title()} University" if ownership_from_filename else "University",
            "source_row_number": source_row_number,
        })
    return rows


def parse_nbte_file(path, ownership_from_filename):
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        fields = parse_tab_row(line)
        if not fields or fields[0] is None:
            continue
        if fields[0].strip().upper() in ("S/N", "S/NO"):
            continue  # header
        source_row_number = fields[0]
        name = fields[1] if len(fields) > 1 else None
        category = fields[2] if len(fields) > 2 else None
        ownership_col = fields[3] if len(fields) > 3 else None
        state = fields[4] if len(fields) > 4 else None
        if not name:
            continue
        ownership = ownership_col or ownership_from_filename
        if ownership:
            ownership = ownership.strip().upper()
            if ownership not in ("FEDERAL", "STATE", "PRIVATE"):
                ownership = ownership_from_filename
        rows.append({
            "raw_name": name,
            "vc_or_provost": None,
            "website": None,
            "year_established": None,
            "ownership": ownership,
            "state": state,
            "raw_category": category or "Unspecified",
            "source_row_number": source_row_number,
        })
    return rows


def parse_ncce_file(path):
    rows = []
    pending_sno = None
    pending_name = None

    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        fields = parse_tab_row(line)
        if not fields or fields[0] is None:
            continue
        first = fields[0].strip()

        if first.upper() == "S/N":
            continue  # header

        if first.upper() == "OPEN":
            if pending_name is None:
                continue  # malformed, no preceding name line, skip defensively
            provost = fields[1] if len(fields) > 1 else None
            ownership_raw = fields[2] if len(fields) > 2 else None
            state = fields[3] if len(fields) > 3 else None
            website = fields[4] if len(fields) > 4 else None

            ownership = None
            if ownership_raw:
                lowered = ownership_raw.lower()
                if "federal" in lowered:
                    ownership = "FEDERAL"
                elif "state" in lowered:
                    ownership = "STATE"
                elif "private" in lowered:
                    ownership = "PRIVATE"
                # "Polytechnics offering NCE" etc: ownership stays None

            rows.append({
                "raw_name": pending_name,
                "vc_or_provost": provost,
                "website": website,
                "year_established": None,
                "ownership": ownership,
                "state": state,
                "raw_category": ownership_raw or "Unspecified",
                "source_row_number": pending_sno,
            })
            pending_sno = None
            pending_name = None
            continue

        if first.isdigit():
            pending_sno = first
            pending_name = fields[1] if len(fields) > 1 else None
        # else: unexpected line shape, skipped defensively

    return rows


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main():
    if not INPUT_DIR.exists():
        print(f"ERROR: input folder not found: {INPUT_DIR.resolve()}")
        print("Edit INPUT_DIR at the top of this script to point at your extracted folder.")
        sys.exit(1)

    all_rows = []
    per_file_counts = {}

    for filename, regulator, institution_type, ownership_from_filename in FILES:
        path = INPUT_DIR / filename
        if not path.exists():
            print(f"WARNING: missing file, skipping: {filename}")
            continue

        if regulator == "NUC":
            parsed = parse_nuc_file(path, ownership_from_filename)
        elif regulator == "NBTE":
            parsed = parse_nbte_file(path, ownership_from_filename)
        elif regulator == "NCCE":
            parsed = parse_ncce_file(path)
        else:
            parsed = []

        per_file_counts[filename] = len(parsed)

        for row in parsed:
            cleaned_name, upgraded_to = strip_upgrade_annotation(row["raw_name"])
            state = row["state"]
            if not state and regulator == "NUC":
                state = guess_state_from_name(cleaned_name)

            all_rows.append({
                "row_id": None,
                "source_file": filename,
                "regulator": regulator,
                "raw_category": row["raw_category"],
                "institution_type": institution_type,
                "ownership": row["ownership"],
                "state": state,
                "country": "Nigeria",
                "raw_name": row["raw_name"],
                "cleaned_name": cleaned_name,
                "website": row["website"],
                "vc_or_provost": row["vc_or_provost"],
                "year_established": row["year_established"],
                "upgraded_to_name": upgraded_to,
                "source_row_number": row["source_row_number"],
            })

    for i, row in enumerate(all_rows, start=1):
        row["row_id"] = i

    fieldnames = [
        "row_id", "source_file", "regulator", "raw_category", "institution_type",
        "ownership", "state", "country", "raw_name", "cleaned_name", "website",
        "vc_or_provost", "year_established", "upgraded_to_name", "source_row_number",
    ]
    with OUTPUT_NORMALIZED.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    # -----------------------------------------------------------------
    # Flagging pass
    # -----------------------------------------------------------------
    flags = []

    def add_flag(flag_type, row_ids, detail):
        flags.append({
            "flag_type": flag_type,
            "row_ids": ";".join(str(r) for r in row_ids),
            "detail": detail,
        })

    for row in all_rows:
        if not row["cleaned_name"]:
            add_flag("CRITICAL_MISSING_NAME", [row["row_id"]], "Row has no usable name")

    for row in all_rows:
        missing = []
        if not row["ownership"]:
            missing.append("ownership")
        if not row["state"]:
            missing.append("state")
        if not row["website"]:
            missing.append("website")
        if missing:
            add_flag("SPARSE_ROW", [row["row_id"]], f"Missing: {', '.join(missing)}")

    university_rows = [r for r in all_rows if r["institution_type"] == "UNIVERSITY"]
    for row in all_rows:
        if not row["upgraded_to_name"]:
            continue
        target_norm = normalize_for_matching(row["upgraded_to_name"])
        match = None
        for uni in university_rows:
            uni_norm = normalize_for_matching(uni["cleaned_name"])
            if uni_norm == target_norm or SequenceMatcher(None, uni_norm, target_norm).ratio() >= 0.90:
                match = uni
                break
        if match:
            add_flag(
                "UPGRADE_MATCH_FOUND",
                [row["row_id"], match["row_id"]],
                f"'{row['cleaned_name']}' says it's now '{row['upgraded_to_name']}', "
                f"matches existing row {match['row_id']} ('{match['cleaned_name']}'). "
                f"Likely the same institution, do not import both.",
            )
        else:
            add_flag(
                "UPGRADE_NO_MATCH_FOUND",
                [row["row_id"]],
                f"'{row['cleaned_name']}' says it's now '{row['upgraded_to_name']}', "
                f"no matching university row found in this dataset. Needs a manual call.",
            )

    polytechnic_rows = [r for r in all_rows if r["institution_type"] == "POLYTECHNIC"]
    for row in all_rows:
        if row["regulator"] != "NCCE":
            continue
        if "polytechnic" not in (row["raw_category"] or "").lower():
            continue
        row_norm = normalize_for_matching(row["cleaned_name"])
        match = None
        for poly in polytechnic_rows:
            poly_norm = normalize_for_matching(poly["cleaned_name"])
            if poly_norm == row_norm or SequenceMatcher(None, poly_norm, row_norm).ratio() >= 0.85:
                match = poly
                break
        if match:
            add_flag(
                "CROSS_REFERENCE_MATCH_FOUND",
                [row["row_id"], match["row_id"]],
                f"NCCE row '{row['cleaned_name']}' (category: {row['raw_category']}) "
                f"matches polytechnic row {match['row_id']} ('{match['cleaned_name']}'). "
                f"Likely the same institution, recommend discarding this NCCE row.",
            )
        else:
            add_flag(
                "CROSS_REFERENCE_NO_MATCH",
                [row["row_id"]],
                f"NCCE row '{row['cleaned_name']}' (category: {row['raw_category']}) "
                f"is polytechnic-flavored but no match found, likely fine as a "
                f"standalone COLLEGE_OF_EDUCATION entry, worth a quick look.",
            )

    buckets = defaultdict(list)
    for row in all_rows:
        words = normalize_for_matching(row["cleaned_name"]).split()
        signature_words = [w for w in words if len(w) >= 4 and w not in STOPWORDS]
        if not signature_words:
            signature_words = words[:1]
        for w in signature_words:
            buckets[w].append(row)

    already_reported = set()
    for word, bucket_rows in buckets.items():
        if len(bucket_rows) < 2:
            continue
        for i in range(len(bucket_rows)):
            for j in range(i + 1, len(bucket_rows)):
                a, b = bucket_rows[i], bucket_rows[j]
                if a["row_id"] == b["row_id"]:
                    continue
                pair_key = tuple(sorted((a["row_id"], b["row_id"])))
                if pair_key in already_reported:
                    continue
                norm_a = normalize_for_matching(a["cleaned_name"])
                norm_b = normalize_for_matching(b["cleaned_name"])
                ratio = SequenceMatcher(None, norm_a, norm_b).ratio()
                if ratio >= 0.95:
                    already_reported.add(pair_key)
                    add_flag(
                        "LIKELY_EXACT_DUPLICATE",
                        [a["row_id"], b["row_id"]],
                        f"'{a['cleaned_name']}' ({a['source_file']}) vs "
                        f"'{b['cleaned_name']}' ({b['source_file']}), ratio={ratio:.2f}",
                    )
                elif ratio >= 0.82:
                    already_reported.add(pair_key)
                    add_flag(
                        "POSSIBLE_DUPLICATE",
                        [a["row_id"], b["row_id"]],
                        f"'{a['cleaned_name']}' ({a['source_file']}) vs "
                        f"'{b['cleaned_name']}' ({b['source_file']}), ratio={ratio:.2f}",
                    )

    flag_fieldnames = ["flag_type", "row_ids", "detail"]
    with OUTPUT_FLAGS.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=flag_fieldnames)
        writer.writeheader()
        writer.writerows(flags)

    # -----------------------------------------------------------------
    # Console summary
    # -----------------------------------------------------------------
    print("=" * 70)
    print("PER-FILE ROW COUNTS")
    print("=" * 70)
    for filename, count in per_file_counts.items():
        print(f"  {filename}: {count}")
    print(f"  TOTAL: {len(all_rows)}")

    print()
    print("=" * 70)
    print("INSTITUTION_TYPE BREAKDOWN (after collapse)")
    print("=" * 70)
    type_counts = defaultdict(int)
    for row in all_rows:
        type_counts[row["institution_type"]] += 1
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")

    print()
    print("=" * 70)
    print("FLAG COUNTS BY TYPE")
    print("=" * 70)
    flag_counts = defaultdict(int)
    for flag in flags:
        flag_counts[flag["flag_type"]] += 1
    for ft, c in sorted(flag_counts.items()):
        print(f"  {ft}: {c}")
    print(f"  TOTAL FLAGS: {len(flags)}")

    print()
    print(f"Wrote {len(all_rows)} rows to {OUTPUT_NORMALIZED.resolve()}")
    print(f"Wrote {len(flags)} flags to {OUTPUT_FLAGS.resolve()}")


if __name__ == "__main__":
    main()