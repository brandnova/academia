import uuid

from django.db import models

from apps.core.slugs import generate_unique_slug


class School(models.Model):
    class VerificationStatus(models.TextChoices):
        UNVERIFIED = "UNVERIFIED", "Unverified"
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"

    class InstitutionType(models.TextChoices):
        UNIVERSITY = "UNIVERSITY", "University"
        POLYTECHNIC = "POLYTECHNIC", "Polytechnic"
        COLLEGE_OF_EDUCATION = "COLLEGE_OF_EDUCATION", "College of Education"

    class Ownership(models.TextChoices):
        FEDERAL = "FEDERAL", "Federal"
        STATE = "STATE", "State"
        PRIVATE = "PRIVATE", "Private"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    short_name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=90, unique=True, editable=False, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
    )
    is_active = models.BooleanField(default=True)

    # School Data Curation fields. All nullable/defaulted so this migration
    # is additive-only, no existing row or endpoint response is affected the
    # moment it runs.
    institution_type = models.CharField(
        max_length=30, choices=InstitutionType.choices, null=True, blank=True
    )
    ownership = models.CharField(max_length=20, choices=Ownership.choices, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    regulatory_code = models.CharField(max_length=50, null=True, blank=True, unique=True)
    source_url = models.URLField(null=True, blank=True)
    # Not auto-derived via signal, deliberately: set explicitly by whatever
    # process last confirmed this record (the import command, or a manual
    # admin correction), same explicit-write pattern already used for slug.
    last_verified_at = models.DateTimeField(null=True, blank=True)
    country = models.CharField(max_length=100, default="Nigeria")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "schools"
        ordering = ["name"]

    def __str__(self):
        return self.short_name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(School, self.short_name or self.name)
        super().save(*args, **kwargs)

    @property
    def has_hub(self):
        return hasattr(self, "hub") and self.hub.is_active


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, related_name="departments", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "departments"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="unique_department_name_per_school")
        ]

    def __str__(self):
        return f"{self.name} ({self.school.short_name})"

    @property
    def question_count(self):
        return self.questions.count()


class SchoolSourceRecord(models.Model):
    """Per-regulator provenance for a School. Exists specifically to support
    'never auto-deactivate a School based on one source disappearing', see
    project-plan.md's Schools Are Platform Data principle: a future re-pull
    of a regulator's list flips is_current to False here rather than
    touching School.is_active directly, leaving that as a deliberate,
    reviewed admin decision instead of an automatic side effect."""

    class Regulator(models.TextChoices):
        NUC = "NUC", "National Universities Commission"
        NBTE = "NBTE", "National Board for Technical Education"
        NCCE = "NCCE", "National Commission for Colleges of Education"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(School, related_name="source_records", on_delete=models.CASCADE)
    regulator = models.CharField(max_length=10, choices=Regulator.choices)
    # The exact original source label (e.g. "Allied Institution", "College
    # of Nursing"), preserved even though it's collapsed into a simpler
    # School.institution_type. Nothing from the source is actually lost.
    raw_category = models.CharField(max_length=100)
    raw_payload = models.JSONField(default=dict, blank=True)
    source_url = models.URLField()
    fetched_at = models.DateTimeField()
    is_current = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "school_source_records"
        ordering = ["-fetched_at"]
        indexes = [
            models.Index(fields=["school", "-fetched_at"]),
            models.Index(fields=["regulator", "is_current"]),
        ]

    def __str__(self):
        return f"{self.regulator} record for {self.school.short_name}"
