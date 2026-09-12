import csv
import json
from datetime import datetime

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.schools.models import School, SchoolSourceRecord


def blank_to_none(value):
    value = (value or "").strip()
    return value or None


def parse_datetime(value):
    value = blank_to_none(value)
    if not value:
        return timezone.now()
    naive = datetime.strptime(value, "%Y-%m-%d")
    return timezone.make_aware(naive)


class Command(BaseCommand):
    help = (
        "One-time import of the cleaned NUC/NBTE/NCCE school directory dataset. "
        "Idempotent: safe to rerun. Never deactivates an existing School. "
        "Matches existing schools by short_name first, then by exact name, "
        "and only fills in fields that are currently blank, never overwrites "
        "a value someone has already set. Newly created schools are imported "
        "with is_active=False, requiring individual admin review and "
        "activation before they're publicly visible, matched/existing "
        "schools keep whatever is_active they already had."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--schools-file", default="apps/schools/data/imports/schools_final.csv",
            help="Path to the cleaned schools CSV.",
        )
        parser.add_argument(
            "--source-records-file", default="apps/schools/data/imports/source_records_final.csv",
            help="Path to the cleaned source records CSV.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Report what would happen without writing anything to the database.",
        )

    def handle(self, *args, **options):
        schools_path = options["schools_file"]
        source_records_path = options["source_records_file"]
        dry_run = options["dry_run"]

        try:
            with open(schools_path, newline="", encoding="utf-8") as f:
                school_rows = list(csv.DictReader(f))
        except FileNotFoundError:
            raise CommandError(f"Schools file not found: {schools_path}")

        try:
            with open(source_records_path, newline="", encoding="utf-8") as f:
                source_record_rows = list(csv.DictReader(f))
        except FileNotFoundError:
            raise CommandError(f"Source records file not found: {source_records_path}")

        source_records_by_canonical_id = {}
        for row in source_record_rows:
            source_records_by_canonical_id.setdefault(row["school_canonical_id"], []).append(row)

        stats = {
            "schools_created": 0,
            "schools_matched_existing": 0,
            "schools_fields_filled": 0,
            "source_records_created": 0,
            "source_records_already_current": 0,
            "warnings": [],
        }

        mode_label = "DRY RUN, nothing will be written" if dry_run else "LIVE RUN"
        self.stdout.write(self.style.WARNING(f"{mode_label}"))

        for row in school_rows:
            canonical_id = row["canonical_id"]
            short_name = row["short_name"].strip()
            name = row["name"].strip()

            existing = School.objects.filter(short_name__iexact=short_name).first()
            if existing is None:
                existing = School.objects.filter(name__iexact=name).first()

            new_field_values = {
                "institution_type": blank_to_none(row["institution_type"]),
                "ownership": blank_to_none(row["ownership"]),
                "state": blank_to_none(row["state"]),
                "country": blank_to_none(row["country"]) or "Nigeria",
                "website": blank_to_none(row["website"]),
                "regulatory_code": blank_to_none(row["regulatory_code"]),
                "source_url": blank_to_none(row["source_url"]),
                "last_verified_at": parse_datetime(row["last_verified_at"]),
            }

            if existing:
                stats["schools_matched_existing"] += 1
                if existing.short_name.lower() != short_name.lower() and existing.name.lower() != name.lower():
                    stats["warnings"].append(
                        f"canonical_id={canonical_id}: matched existing School id={existing.id} "
                        f"('{existing.short_name}') on a partial signal, double check this is correct."
                    )

                changed = False
                for field, value in new_field_values.items():
                    if value is None:
                        continue
                    current = getattr(existing, field)
                    if not current:
                        if not dry_run:
                            setattr(existing, field, value)
                        changed = True

                if changed:
                    stats["schools_fields_filled"] += 1
                    if not dry_run:
                        existing.save()

                school = existing
            else:
                stats["schools_created"] += 1
                if dry_run:
                    school = None
                else:
                    school = School.objects.create(
                        name=name,
                        short_name=short_name,
                        # Imported schools land inactive by default. Given the
                        # real data-quality issues this dataset surfaced
                        # (confirmed wrong merges, ~470 unresolved duplicate
                        # candidates still outstanding in
                        # known_possible_duplicates.csv), a newly imported
                        # school should not be publicly visible or
                        # searchable until an admin has individually
                        # reviewed and activated it. This is a genuine
                        # manual QA gate, not a soft-delete, and is
                        # unrelated to Hub activation, a school can be
                        # activated (is_active=True) long before anyone
                        # requests a hub for it.
                        is_active=False,
                        **new_field_values,
                    )

            for source_row in source_records_by_canonical_id.get(canonical_id, []):
                try:
                    raw_payload = json.loads(source_row["raw_payload_json"] or "{}")
                except json.JSONDecodeError:
                    raw_payload = {}
                    stats["warnings"].append(
                        f"canonical_id={canonical_id}: could not parse raw_payload_json, stored as empty dict."
                    )

                if dry_run:
                    stats["source_records_created"] += 1
                    continue

                source_record, created = SchoolSourceRecord.objects.get_or_create(
                    school=school,
                    regulator=source_row["regulator"],
                    raw_category=source_row["raw_category"],
                    defaults={
                        "raw_payload": raw_payload,
                        "source_url": blank_to_none(source_row["source_url"]) or "",
                        "fetched_at": parse_datetime(source_row["fetched_at"]),
                        "is_current": True,
                    },
                )
                if created:
                    stats["source_records_created"] += 1
                else:
                    stats["source_records_already_current"] += 1

        self.stdout.write("=" * 70)
        self.stdout.write("IMPORT SUMMARY")
        self.stdout.write("=" * 70)
        self.stdout.write(f"  Schools created:              {stats['schools_created']}")
        self.stdout.write(f"  Schools matched to existing:  {stats['schools_matched_existing']}")
        self.stdout.write(f"  Existing schools, fields filled in: {stats['schools_fields_filled']}")
        self.stdout.write(f"  Source records created:       {stats['source_records_created']}")
        self.stdout.write(f"  Source records already present: {stats['source_records_already_current']}")
        self.stdout.write(f"  Warnings: {len(stats['warnings'])}")
        for warning in stats["warnings"]:
            self.stdout.write(self.style.WARNING(f"    - {warning}"))

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run complete, nothing was written."))
        else:
            self.stdout.write(self.style.SUCCESS("Import complete."))