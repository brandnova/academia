#!/usr/bin/env python3
"""
Academia school-directory data prep, stage 3: apply manually-confirmed
decisions and finalize.

Reads schools_ready_for_import.csv and source_records_ready_for_import.csv
(from stage 2) and applies a fixed, explicit set of human-reviewed
decisions: confirmed merges, a rejected-merge no-op list (for the record),
missing-field patches, and short_name regeneration for known placeholder-
website collisions. No fuzzy matching happens in this script.

Produces the final:
  1. schools_final.csv
  2. source_records_final.csv
"""

import csv
import re
from pathlib import Path

SCHOOLS_IN = Path("schools_ready_for_import.csv")
SOURCE_RECORDS_IN = Path("source_records_ready_for_import.csv")
SCHOOLS_OUT = Path("schools_final.csv")
SOURCE_RECORDS_OUT = Path("source_records_final.csv")

# Each tuple: (row_ids to merge together), (final name to use), (final state)
# row_ids are the ORIGINAL schools_normalized.csv row_id values, looked up
# via each canonical row's merged_from_row_ids column.
CONFIRMED_MERGES = [
    # Delta State College of Nursing Sciences, 5-campus consolidation
    ([917, 919, 920, 921, 922, 923, 924], "Delta State College of Nursing Sciences", "Delta"),
    # Comma/case duplicate, not a real campus variant (detector bug)
    ([788, 793], None, None),
    # Confirmed NCCE cross-references
    ([1097, 376], None, None),
    ([1231, 397], None, None),
    ([1255, 393], None, None),
    ([1258, 350], None, None),
    ([1261, 395], None, None),
    ([1264, 398], None, None),
    ([1291, 394], None, None),
    ([1311, 421], None, None),
    ([1352, 355], None, None),
]

# canonical row_id (any member) -> state to patch in
STATE_PATCHES = {
    536: "Bayelsa",       # Yenagoa Polytechnic
    747: "Sokoto",        # Sultan Abdulrahman College of Health Technology
    754: "Kwara",         # School of Orthopedic Cast Technology, UITH
}

BAD_SHORT_NAME_PATTERNS = {"NODOMAIN", "NONE", "SOMETHINGEDU", "NA", "NULL"}


def parse_member_ids(merged_from_row_ids):
    return set(int(x) for x in merged_from_row_ids.split(";") if x)


def load_schools():
    with SCHOOLS_IN.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def load_source_records():
    with SOURCE_RECORDS_IN.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def find_canonical_by_row_id(schools, row_id):
    for s in schools:
        if row_id in parse_member_ids(s["merged_from_row_ids"]):
            return s
    return None


def generate_fallback_short_name(name):
    stopwords = {"of", "and", "for", "in", "at", "the", "a", "an", "state", "federal", "private"}
    words = [w for w in re.sub(r"[^\w\s]", " ", name).split() if w.lower() not in stopwords]
    if not words:
        words = name.split()
    return ("".join(w[0] for w in words[:6])).upper() or "SCHOOL"


def main():
    schools = load_schools()
    source_records = load_source_records()

    # ---- Apply confirmed merges ----
    for row_ids, override_name, override_state in CONFIRMED_MERGES:
        canon_rows = []
        seen_canon_ids = set()
        for rid in row_ids:
            c = find_canonical_by_row_id(schools, rid)
            if c and c["canonical_id"] not in seen_canon_ids:
                canon_rows.append(c)
                seen_canon_ids.add(c["canonical_id"])
        if len(canon_rows) < 2:
            continue  # already merged or not found, skip safely

        def completeness(r):
            return sum([bool(r["state"]), bool(r["ownership"]), bool(r["website"])])

        primary = max(canon_rows, key=completeness)
        absorbed = [r for r in canon_rows if r is not primary]

        if override_name:
            primary["name"] = override_name
        if override_state:
            primary["state"] = override_state

        all_member_ids = set()
        for r in canon_rows:
            all_member_ids |= parse_member_ids(r["merged_from_row_ids"])
        primary["merged_from_row_ids"] = ";".join(str(i) for i in sorted(all_member_ids))

        absorbed_ids = {r["canonical_id"] for r in absorbed}
        for sr in source_records:
            if sr["school_canonical_id"] in absorbed_ids:
                sr["school_canonical_id"] = primary["canonical_id"]

        schools = [s for s in schools if s["canonical_id"] not in absorbed_ids]

    # ---- Patch missing state values ----
    for rid, state in STATE_PATCHES.items():
        c = find_canonical_by_row_id(schools, rid)
        if c and not c["state"]:
            c["state"] = state

    # ---- Regenerate bad short_names ----
    all_short_names = {s["short_name"] for s in schools}
    for s in schools:
        if s["short_name"].upper() in BAD_SHORT_NAME_PATTERNS or re.match(r"^NODOMAIN", s["short_name"]):
            candidate = generate_fallback_short_name(s["name"])
            original = candidate
            tries = 0
            while candidate in all_short_names and candidate != s["short_name"]:
                tries += 1
                candidate = f"{original}{tries}"
            all_short_names.discard(s["short_name"])
            s["short_name"] = candidate
            all_short_names.add(candidate)

    # ---- Final global uniqueness safety net ----
    seen = {}
    for s in schools:
        seen.setdefault(s["short_name"], []).append(s)
    remaining_collisions = 0
    for name, group in seen.items():
        if len(group) > 1:
            remaining_collisions += len(group)
            for i, s in enumerate(group[1:], start=1):
                s["short_name"] = f"{name}{i+1}"

    with SCHOOLS_OUT.open("w", newline="", encoding="utf-8") as f:
        fieldnames = list(schools[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(schools)

    with SOURCE_RECORDS_OUT.open("w", newline="", encoding="utf-8") as f:
        fieldnames = list(source_records[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(source_records)

    print(f"Final schools: {len(schools)}")
    print(f"Final source records: {len(source_records)}")
    print(f"Remaining short_name collisions patched with numeric suffix: {remaining_collisions}")
    print(f"Wrote {SCHOOLS_OUT}, {SOURCE_RECORDS_OUT}")


if __name__ == "__main__":
    main()