"""
Quick reference:
python manage.py seed_demo_data --clear
python manage.py seed_demo_data --clear --admin-email YOUR_ACTUAL_GMAIL@gmail.com
eval "$(python manage.py print_test_tokens)"   # after seeding, see that command's help
"""
import random
import re

from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.answers.models import Answer, AnswerVote
from apps.comments.models import Comment
from apps.hubs.models import (
    Hub,
    HubActivationRequest,
    ModeratorAssignment,
    SchoolRepresentativeAssignment,
)
from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.pages.models import StaticPage
from apps.questions.models import Question, QuestionFollow
from apps.reports.models import Report
from apps.schools.models import Department, School
from apps.tags.models import QuestionTag, Tag

SCHOOL_DATA = [
    # (name, short_name, location, institution_type, ownership, state)
    ("University of Lagos", "UNILAG", "Lagos, Nigeria", "UNIVERSITY", "FEDERAL", "Lagos"),
    ("University of Ibadan", "UI", "Ibadan, Nigeria", "UNIVERSITY", "FEDERAL", "Oyo"),
    ("Obafemi Awolowo University", "OAU", "Ile-Ife, Nigeria", "UNIVERSITY", "FEDERAL", "Osun"),
    ("Ahmadu Bello University", "ABU", "Zaria, Nigeria", "UNIVERSITY", "FEDERAL", "Kaduna"),
    ("University of Nigeria, Nsukka", "UNN", "Nsukka, Nigeria", "UNIVERSITY", "FEDERAL", "Enugu"),
    ("Federal University of Technology, Akure", "FUTA", "Akure, Nigeria", "UNIVERSITY", "FEDERAL", "Ondo"),
    ("Lagos State University", "LASU", "Lagos, Nigeria", "UNIVERSITY", "STATE", "Lagos"),
    ("Covenant University", "CU", "Ota, Nigeria", "UNIVERSITY", "PRIVATE", "Ogun"),
    ("University of Benin", "UNIBEN", "Benin City, Nigeria", "UNIVERSITY", "FEDERAL", "Edo"),
    ("Nnamdi Azikiwe University", "UNIZIK", "Awka, Nigeria", "UNIVERSITY", "FEDERAL", "Anambra"),
    ("Yaba College of Technology", "YABATECH", "Lagos, Nigeria", "POLYTECHNIC", "FEDERAL", "Lagos"),
    ("Federal College of Education, Zaria", "FCE ZARIA", "Zaria, Nigeria", "COLLEGE_OF_EDUCATION", "FEDERAL", "Kaduna"),
    ("Bayero University Kano", "BUK", "Kano, Nigeria", "UNIVERSITY", "FEDERAL", "Kano"),
    ("Federal University of Technology, Minna", "FUTMINNA", "Minna, Nigeria", "UNIVERSITY", "FEDERAL", "Niger"),
]

DEPARTMENT_NAMES = [
    ("Computer Science", "CSC"),
    ("Accounting", "ACC"),
    ("Law", "LAW"),
    ("Medicine and Surgery", "MED"),
    ("Economics", "ECO"),
    ("Mass Communication", "MCM"),
    ("Electrical Engineering", "EEE"),
    ("Architecture", "ARC"),
    ("Microbiology", "MCB"),
]

FIRST_NAMES = ["Ada", "Chidi", "Ngozi", "Tunde", "Bisi", "Emeka", "Yemi", "Fatima",
               "Kelechi", "Segun", "Amara", "Femi", "Chioma", "Ibrahim", "Halima",
               "Uche", "Zainab", "Kunle", "Chinedu", "Aisha", "Obinna", "Blessing",
               "Musa", "Ifeoma", "Damilola"]
LAST_NAMES = ["Okafor", "Bello", "Adeyemi", "Eze", "Suleiman", "Nwosu", "Balogun",
              "Abdullahi", "Okonkwo", "Yusuf", "Adewale", "Chukwu", "Garba"]

TAGS_POOL = ["gpa", "cgpa", "clearance", "registration", "siwes", "admission",
             "hostel", "exams", "transcript", "grading", "project", "convocation",
             "resumption", "school-fees", "id-card", "postgraduate"]

QUESTION_TEMPLATES = [
    ("How do I calculate my {dept} CGPA?", "I'm confused about the grading formula used in {dept}, can someone explain?"),
    ("What documents are needed for clearance?", "First year here, not sure what's required for {dept} clearance."),
    ("When does course registration open?", "Is there a fixed date every semester for {dept} students?"),
    ("What should I expect during SIWES?", "About to start my SIWES placement, any tips for {dept} students?"),
    ("What happens if I miss a project deadline?", "Missed the submission window for my {dept} project, what now?"),
    ("How do I change departments?", "Thinking of switching out of {dept}, what is the process?"),
    ("Where do I collect my transcript?", "Need an official transcript from {dept}, where do I start?"),
    ("Is attendance compulsory for all {dept} courses?", "Some lecturers seem stricter about this than others."),
    ("How do I get my hostel allocation?", "Trying to figure out the {dept} hostel allocation timeline."),
    ("When is the school fees deadline this semester?", "Don't want to miss it and get deregistered from {dept}."),
    ("What's the process for postgraduate admission?", "Want to proceed from {dept} straight into a masters program."),
    ("How do I replace a lost ID card?", "Lost mine on campus, does {dept} have a specific replacement process?"),
]

ANSWER_TEMPLATES = [
    "From what I remember, you need to visit the {dept} departmental office first.",
    "This usually depends on your level, but generally the process starts with your HOD.",
    "I went through this last semester, happy to share what worked for me.",
    "Check the school's official portal, they usually post updates there.",
    "Ask your course adviser directly, they will have the most accurate answer.",
    "There's a notice board outside the {dept} office with the exact steps.",
    "Honestly this changed recently, so double check with the current session's memo.",
]

COMMENT_TEMPLATES = [
    "Does this apply to every session or just this one?",
    "Thanks, this actually helped a lot.",
    "I heard something different from my course rep, can you confirm?",
    "Where did you get this information from?",
    "Same thing happened to me last year, this checks out.",
]

STATIC_PAGE_DATA = [
    {
        "title": "Privacy Policy",
        "visibility": StaticPage.Visibility.PUBLIC,
        "is_published": True,
        "body": "# Privacy Policy\n\nThis is placeholder seed content describing how "
                "Academia handles user data. Replace with the real policy before launch.",
    },
    {
        "title": "Terms of Service",
        "visibility": StaticPage.Visibility.PUBLIC,
        "is_published": True,
        "body": "# Terms of Service\n\nPlaceholder seed content outlining platform "
                "usage terms. Replace with the real terms before launch.",
    },
    {
        "title": "Community Guidelines",
        "visibility": StaticPage.Visibility.PUBLIC,
        "is_published": True,
        "body": "# Community Guidelines\n\nBe respectful, cite your sources when "
                "you can, and report content that looks like spam or misinformation.",
    },
    {
        "title": "Moderator and Representative Handbook",
        "visibility": StaticPage.Visibility.STAFF,
        "is_published": True,
        "body": "# Welcome, Moderator or Representative\n\nThis page is only visible "
                "to staff. It covers what's expected of you in your hub.",
    },
    {
        "title": "Upcoming Verification Policy",
        "visibility": StaticPage.Visibility.PUBLIC,
        "is_published": False,
        "body": "# Draft: School Verification Policy\n\nNot ready for publication yet, "
                "seeded here specifically to exercise the draft/unpublished state.",
    },
]

DEMO_EMAIL_RE = re.compile(r"^demo\d{3}@example\.com$")

FIXED_TEST_USERS = {
    "admin": {"email": "test-admin@example.com", "full_name": "Test Admin", "is_admin": True},
    "staff": {"email": "test-staff@example.com", "full_name": "Test Staff (Mod + Rep)", "is_admin": False},
    "user": {"email": "test-user@example.com", "full_name": "Test User", "is_admin": False},
}


class Command(BaseCommand):
    help = (
        "Seed the database with demo content for frontend/backend testing. Safe to "
        "run repeatedly without --clear, demo users/schools/departments/tags are "
        "reused (deterministic), new content is added on top each run. Also creates "
        "three fixed test users (admin, staff, regular) with predictable emails and "
        "role-appropriate sample content, and fully populates your real --admin-email "
        "account (questions, answers, votes, notifications) so you can browse the "
        "whole site as yourself."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--users", type=int, default=15,
            help="Number of demo users to maintain (deterministic identities, not additive).",
        )
        parser.add_argument(
            "--clear", action="store_true",
            help=(
                "Wipe existing seeded content (schools, hubs, questions, answers, "
                "tags, reports, notifications, static pages, role assignments), "
                "demo user accounts, AND the three fixed test users, before "
                "seeding fresh. Real accounts (your superuser, any Google-"
                "authenticated account) are never touched, including whatever "
                "content is attached to --admin-email, only the demo/test layer "
                "around it is reset."
            ),
        )
        parser.add_argument(
            "--admin-email", type=str, default=None,
            help=(
                "Email of an existing real user account (already created via "
                "Google login or createsuperuser). Grants is_admin=True AND fully "
                "populates that account: hub rep+mod role, several authored "
                "questions, answers, an existing vote, notifications across "
                "several types, so you can sample the whole site as yourself "
                "immediately. Must already exist, this command will not create it."
            ),
        )

    def handle(self, *args, **options):
        admin_user = self._get_and_promote_admin(options.get("admin_email"))

        if options["clear"]:
            self._clear_content()
            self._clear_demo_users()
            self._clear_fixed_test_users()
            self.stdout.write(self.style.SUCCESS(
                "Cleared existing seeded content, demo users, and fixed test users."
            ))
        elif School.objects.exists():
            self.stdout.write(
                "Existing content found, adding new demo content on top "
                "(pass --clear first if you want a fresh dataset instead)."
            )

        with transaction.atomic():
            demo_users = self._create_demo_users(options["users"])
            test_users = self._create_fixed_test_users()
            schools = self._create_schools()
            hubs = self._activate_hubs(schools, demo_users)
            self._create_departments(schools)
            self._assign_roles(hubs, demo_users)
            self._assign_fixed_test_roles(hubs, test_users)
            self._assign_admin_role(hubs, admin_user)
            tags = self._create_tags()
            questions = self._create_questions_and_answers(hubs, demo_users, tags)
            self._add_follows_and_locks(questions, demo_users)
            self._seed_fixed_test_user_activity(hubs, tags, demo_users, test_users)
            self._seed_admin_user_activity(hubs, tags, demo_users, admin_user)
            self._create_reports(demo_users)
            self._create_static_pages(demo_users)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self._print_test_user_hint(admin_user)

    # --- admin-email: full treatment ---------------------------------------

    def _get_and_promote_admin(self, email):
        if not email:
            return None
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(
                f"--admin-email: no account found for '{email}'. This must already "
                f"exist (log in via Google or run createsuperuser first). Skipping."
            ))
            return None
        if not user.is_admin:
            user.is_admin = True
            user.save(update_fields=["is_admin", "updated_at"])
        return user

    def _assign_admin_role(self, hubs, admin_user):
        if not admin_user or not hubs:
            return
        first_hub = hubs[0]
        SchoolRepresentativeAssignment.objects.get_or_create(hub=first_hub, user=admin_user)
        ModeratorAssignment.objects.get_or_create(hub=first_hub, user=admin_user)
        self.stdout.write(
            f"  Assigned {admin_user.email} as representative and moderator "
            f"for {first_hub.school.short_name}."
        )

    def _seed_admin_user_activity(self, hubs, tags, demo_users, admin_user):
        if not admin_user:
            return

        self.stdout.write(f"Populating {admin_user.email} with full sample content...")

        target_hubs = [h for h in hubs[:2] if h is not None]
        authored_questions = []

        for hub in target_hubs:
            departments = list(hub.school.departments.all())
            for _ in range(2):
                title_template, body_template = random.choice(QUESTION_TEMPLATES)
                department = random.choice(departments) if departments else None
                dept_name = department.name if department else hub.school.name
                question = Question.objects.create(
                    title=title_template.format(dept=dept_name),
                    body=body_template.format(dept=dept_name),
                    author=admin_user, hub=hub, department=department,
                    view_count=random.randint(0, 150),
                )
                authored_questions.append(question)
                for tag in random.sample(tags, k=min(random.randint(0, 2), len(tags))):
                    QuestionTag.objects.get_or_create(question=question, tag=tag)

        # Two of the admin's questions get answered -> NEW_ANSWER x2
        for question in authored_questions[:2]:
            candidates = [u for u in demo_users if u.id != admin_user.id]
            if not candidates:
                continue
            answerer = random.choice(candidates)
            dept_name = question.department.name if question.department else question.hub.school.name
            Answer.objects.create(
                body=random.choice(ANSWER_TEMPLATES).format(dept=dept_name),
                author=answerer, question=question,
            )
            Question.objects.filter(id=question.id).update(status=Question.Status.ANSWERED)
            notify(
                user=admin_user, notification_type=Notification.Type.NEW_ANSWER,
                message=f"{answerer.full_name} answered your question: '{question.title}'",
                content_object=question,
            )

        # Admin answers an existing demo question and it gets marked best -> BEST_ANSWER
        other_question = Question.objects.exclude(author=admin_user).order_by("?").first()
        if other_question:
            admin_answer = Answer.objects.create(
                body=random.choice(ANSWER_TEMPLATES).format(dept=other_question.hub.school.name),
                author=admin_user, question=other_question,
            )
            Answer.objects.filter(question=other_question, is_best=True).update(is_best=False)
            Answer.objects.filter(id=admin_answer.id).update(is_best=True)
            Question.objects.filter(id=other_question.id).update(status=Question.Status.SOLVED)
            notify(
                user=admin_user, notification_type=Notification.Type.BEST_ANSWER,
                message=f"Your answer was marked as best on: '{other_question.title}'",
                content_object=other_question,
            )

        # Standing upvote on an existing demo answer, so "already voted" is
        # testable immediately without a setup step
        votable_answer = Answer.objects.exclude(author=admin_user).order_by("?").first()
        if votable_answer:
            vote, created = AnswerVote.objects.get_or_create(
                answer=votable_answer, user=admin_user,
                defaults={"vote_type": AnswerVote.VoteType.UP},
            )
            if created:
                Answer.objects.filter(id=votable_answer.id).update(
                    vote_score=votable_answer.vote_score + 1
                )

        # Following an existing question, so is_following is testable
        followable_question = Question.objects.exclude(author=admin_user).order_by("?").first()
        if followable_question:
            QuestionFollow.objects.get_or_create(user=admin_user, question=followable_question)

        if target_hubs:
            notify(
                user=admin_user, notification_type=Notification.Type.MODERATOR_ASSIGNED,
                message=f"You've been assigned as a moderator and representative for {target_hubs[0].school.short_name}",
                content_object=target_hubs[0],
            )

        # Admin-specific notifications, now that this account is genuinely admin
        if authored_questions:
            content_type = ContentType.objects.get_for_model(Question)
            reporter = random.choice(demo_users) if demo_users else None
            if reporter:
                report, _ = Report.objects.get_or_create(
                    reporter=reporter, content_type=content_type, object_id=authored_questions[0].id,
                    defaults={
                        "type": Report.ReportType.SPAM, "status": Report.Status.PENDING,
                        "description": "Seeded sample report for admin notification testing.",
                    },
                )
                notify(
                    user=admin_user, notification_type=Notification.Type.NEW_REPORT,
                    message="New spam report submitted", content_object=report,
                )

        pending_request = HubActivationRequest.objects.filter(
            status=HubActivationRequest.Status.PENDING
        ).first()
        if pending_request:
            notify(
                user=admin_user, notification_type=Notification.Type.NEW_ACTIVATION_REQUEST,
                message=f"New hub activation request for {pending_request.school.short_name}",
                content_object=pending_request,
            )

        # Leave a couple read, the rest unread, so read/unread state has both to test
        read_count = 2
        for notification in Notification.objects.filter(user=admin_user).order_by("created_at")[:read_count]:
            Notification.objects.filter(id=notification.id).update(is_read=True)

        self.stdout.write(
            f"  {admin_user.email}: {len(authored_questions)} authored questions, "
            f"varied notifications, a standing vote, and a followed question."
        )

    # --- fixed test users: lighter, role-appropriate ------------------------

    def _create_fixed_test_users(self):
        self.stdout.write("Creating fixed test users (admin, staff, regular)...")
        users = {}
        for key, data in FIXED_TEST_USERS.items():
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={"full_name": data["full_name"], "is_admin": data["is_admin"]},
            )
            if created:
                user.set_unusable_password()
                user.save()
            elif user.is_admin != data["is_admin"]:
                user.is_admin = data["is_admin"]
                user.save(update_fields=["is_admin", "updated_at"])
            users[key] = user
        return users

    def _clear_fixed_test_users(self):
        emails = [data["email"] for data in FIXED_TEST_USERS.values()]
        User.objects.filter(email__in=emails).delete()
        self.stdout.write("  Removed previous fixed test user accounts (will be recreated fresh).")

    def _assign_fixed_test_roles(self, hubs, test_users):
        if not hubs:
            return
        first_hub = hubs[0]
        staff_user = test_users["staff"]
        SchoolRepresentativeAssignment.objects.get_or_create(hub=first_hub, user=staff_user)
        ModeratorAssignment.objects.get_or_create(hub=first_hub, user=staff_user)
        self.stdout.write(
            f"  Assigned test-staff as representative and moderator for {first_hub.school.short_name}."
        )

    def _seed_fixed_test_user_activity(self, hubs, tags, demo_users, test_users):
        if not hubs:
            return

        self.stdout.write("Seeding a light, role-appropriate sample for each fixed test user...")
        first_hub = hubs[0]
        departments = list(first_hub.school.departments.all())
        admin_user = test_users["admin"]
        staff_user = test_users["staff"]
        regular_user = test_users["user"]

        def make_question(author, hub=first_hub):
            title_template, body_template = random.choice(QUESTION_TEMPLATES)
            department = random.choice(departments) if departments else None
            dept_name = department.name if department else hub.school.name
            question = Question.objects.create(
                title=title_template.format(dept=dept_name), body=body_template.format(dept=dept_name),
                author=author, hub=hub, department=department,
            )
            if tags:
                for tag in random.sample(tags, k=min(2, len(tags))):
                    QuestionTag.objects.get_or_create(question=question, tag=tag)
            return question

        # --- test-staff: mod + rep, one best answer, MODERATOR_ASSIGNED, NEW_QUESTION ---
        staff_questions = [make_question(staff_user), make_question(staff_user)]

        staff_answer = Answer.objects.create(
            body=random.choice(ANSWER_TEMPLATES).format(dept=first_hub.school.name),
            author=staff_user, question=staff_questions[1] if len(staff_questions) > 1 else staff_questions[0],
        )
        Answer.objects.filter(id=staff_answer.id).update(is_best=True)
        Question.objects.filter(id=staff_answer.question_id).update(status=Question.Status.SOLVED)
        notify(
            user=staff_user, notification_type=Notification.Type.BEST_ANSWER,
            message=f"Your answer was marked as best on: '{staff_answer.question.title}'",
            content_object=staff_answer.question,
        )

        notify(
            user=staff_user, notification_type=Notification.Type.MODERATOR_ASSIGNED,
            message=f"You've been assigned as a moderator and representative for {first_hub.school.short_name}",
            content_object=first_hub,
        )

        demo_question_in_hub = Question.objects.filter(hub=first_hub).exclude(author=staff_user).order_by("?").first()
        if demo_question_in_hub:
            notify(
                user=staff_user, notification_type=Notification.Type.NEW_QUESTION,
                message=f"New question posted in {first_hub.school.short_name}: '{demo_question_in_hub.title}'",
                content_object=demo_question_in_hub,
            )

        oldest_staff_notif = Notification.objects.filter(user=staff_user).order_by("created_at").first()
        if oldest_staff_notif:
            Notification.objects.filter(id=oldest_staff_notif.id).update(is_read=True)

        # --- test-user: plain, NEW_ANSWER + VOTE + NEW_COMMENT ---
        user_questions = [make_question(regular_user), make_question(regular_user)]

        if demo_users:
            answerer = random.choice(demo_users)
            Answer.objects.create(
                body=random.choice(ANSWER_TEMPLATES).format(dept=first_hub.school.name),
                author=answerer, question=user_questions[0],
            )
            Question.objects.filter(id=user_questions[0].id).update(status=Question.Status.ANSWERED)
            notify(
                user=regular_user, notification_type=Notification.Type.NEW_ANSWER,
                message=f"{answerer.full_name} answered your question: '{user_questions[0].title}'",
                content_object=user_questions[0],
            )

        other_demo_question = Question.objects.exclude(author=regular_user).order_by("?").first()
        if other_demo_question:
            regular_answer = Answer.objects.create(
                body=random.choice(ANSWER_TEMPLATES).format(dept=other_demo_question.hub.school.name),
                author=regular_user, question=other_demo_question,
            )
            voter = next((u for u in demo_users if u.id != regular_user.id), None)
            if voter:
                vote, created = AnswerVote.objects.get_or_create(
                    answer=regular_answer, user=voter, defaults={"vote_type": AnswerVote.VoteType.UP},
                )
                if created:
                    Answer.objects.filter(id=regular_answer.id).update(vote_score=1)
                    notify(
                        user=regular_user, notification_type=Notification.Type.VOTE,
                        message="Your answer received an upvote", content_object=regular_answer,
                    )
            commenter = next((u for u in demo_users if u.id not in {regular_user.id, getattr(voter, "id", None)}), None)
            if commenter:
                Comment.objects.create(
                    body=random.choice(COMMENT_TEMPLATES), author=commenter, answer=regular_answer,
                )
                notify(
                    user=regular_user, notification_type=Notification.Type.NEW_COMMENT,
                    message=f"{commenter.full_name} commented on your answer", content_object=regular_answer,
                )

        oldest_user_notif = Notification.objects.filter(user=regular_user).order_by("created_at").first()
        if oldest_user_notif:
            Notification.objects.filter(id=oldest_user_notif.id).update(is_read=True)

        # --- test-admin: light, admin-focused only ---
        admin_question = make_question(admin_user)

        content_type = ContentType.objects.get_for_model(Question)
        report, _ = Report.objects.get_or_create(
            reporter=regular_user, content_type=content_type, object_id=admin_question.id,
            defaults={
                "type": Report.ReportType.SPAM, "status": Report.Status.PENDING,
                "description": "Seeded sample report for test-admin notification testing.",
            },
        )
        notify(
            user=admin_user, notification_type=Notification.Type.NEW_REPORT,
            message="New spam report submitted", content_object=report,
        )

        pending_request = HubActivationRequest.objects.filter(
            status=HubActivationRequest.Status.PENDING
        ).first()
        if pending_request:
            notify(
                user=admin_user, notification_type=Notification.Type.NEW_ACTIVATION_REQUEST,
                message=f"New hub activation request for {pending_request.school.short_name}",
                content_object=pending_request,
            )

        self.stdout.write("  Fixed test users seeded with role-appropriate sample content.")

    def _print_test_user_hint(self, admin_user):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Fixed test users ready for cURL testing:"))
        for data in FIXED_TEST_USERS.values():
            self.stdout.write(f"  {data['full_name']}: {data['email']}")
        self.stdout.write('Run: eval "$(python manage.py print_test_tokens)" to get fresh tokens for all three.')
        if admin_user:
            self.stdout.write(
                f"{admin_user.email} has been fully populated (questions, answers, "
                f"votes, notifications), log in via Google to browse as yourself."
            )

    # --- demo content (unchanged) -------------------------------------------

    def _clear_content(self):
        self.stdout.write("Clearing existing seeded content...")
        Notification.objects.all().delete()
        Report.objects.all().delete()
        StaticPage.objects.all().delete()
        School.objects.all().delete()
        Tag.objects.all().delete()

    def _clear_demo_users(self):
        candidates = User.objects.filter(
            email__startswith="demo", email__endswith="@example.com", is_admin=False,
        )
        to_delete_ids = [u.id for u in candidates if DEMO_EMAIL_RE.fullmatch(u.email)]
        deleted_count = len(to_delete_ids)
        User.objects.filter(id__in=to_delete_ids).delete()
        self.stdout.write(f"  Removed {deleted_count} previously seeded demo user account(s).")

    def _create_demo_users(self, count):
        self.stdout.write("Creating demo users (deterministic identities)...")
        demo_users = []
        for i in range(count):
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            last = LAST_NAMES[(i // len(FIRST_NAMES)) % len(LAST_NAMES)]
            email = f"demo{i:03d}@example.com"
            user, created = User.objects.get_or_create(
                email=email, defaults={"full_name": f"{first} {last}"},
            )
            if created:
                user.set_unusable_password()
                user.save()
            demo_users.append(user)
        return demo_users

    def _create_schools(self):
        self.stdout.write("Creating schools...")
        schools = []
        for name, short_name, location, institution_type, ownership, state in SCHOOL_DATA:
            school, _ = School.objects.get_or_create(
                short_name=short_name,
                defaults={
                    "name": name, "location": location,
                    "verification_status": School.VerificationStatus.VERIFIED,
                    "institution_type": institution_type,
                    "ownership": ownership,
                    "state": state,
                    "country": "Nigeria",
                },
            )
            schools.append(school)
        return schools

    def _activate_hubs(self, schools, demo_users):
        self.stdout.write("Activating hubs for most schools, leaving a couple unclaimed...")
        hubs = []
        activatable = schools[:-2]
        pending_only_school = schools[-2]
        unclaimed_school = schools[-1]
        requester = demo_users[0]

        for school in activatable:
            hub, _ = Hub.objects.get_or_create(
                school=school, defaults={"is_active": True, "activated_at": timezone.now()},
            )
            hubs.append(hub)

        HubActivationRequest.objects.get_or_create(
            school=pending_only_school, user=requester,
            defaults={"status": HubActivationRequest.Status.PENDING, "notes": "Students need a hub here."},
        )

        self.stdout.write(f"  {unclaimed_school.short_name}: no hub, no request (empty state).")
        self.stdout.write(f"  {pending_only_school.short_name}: PENDING activation request only.")
        return hubs

    def _create_departments(self, schools):
        self.stdout.write("Creating departments...")
        for school in schools:
            if not hasattr(school, "hub"):
                continue
            chosen = random.sample(DEPARTMENT_NAMES, k=min(4, len(DEPARTMENT_NAMES)))
            for name, code in chosen:
                Department.objects.get_or_create(school=school, name=name, defaults={"code": code})

    def _assign_roles(self, hubs, demo_users):
        if not hubs or len(demo_users) < 3:
            return
        self.stdout.write("Assigning a demo representative and moderator to the first hub...")
        first_hub = hubs[0]
        SchoolRepresentativeAssignment.objects.get_or_create(hub=first_hub, user=demo_users[1])
        ModeratorAssignment.objects.get_or_create(hub=first_hub, user=demo_users[2])

    def _create_tags(self):
        self.stdout.write("Creating tags...")
        return [Tag.objects.get_or_create(name=name)[0] for name in TAGS_POOL]

    def _create_questions_and_answers(self, hubs, demo_users, tags):
        self.stdout.write("Creating questions, answers, votes, and comments...")
        all_questions = []

        for index, hub in enumerate(hubs):
            if index == len(hubs) - 1:
                self.stdout.write(f"  Leaving {hub.school.short_name} with zero questions (empty state).")
                continue

            departments = list(hub.school.departments.all())
            question_count = 25 if index == 0 else random.randint(3, 10)

            for _ in range(question_count):
                title_template, body_template = random.choice(QUESTION_TEMPLATES)
                department = random.choice(departments) if departments and random.random() > 0.3 else None
                dept_name = department.name if department else hub.school.name
                author = random.choice(demo_users)

                question = Question.objects.create(
                    title=title_template.format(dept=dept_name),
                    body=body_template.format(dept=dept_name),
                    author=author, hub=hub, department=department,
                    view_count=random.randint(0, 300),
                )
                all_questions.append(question)

                for tag in random.sample(tags, k=random.randint(0, 3)):
                    QuestionTag.objects.get_or_create(question=question, tag=tag)

                outcome = random.random()
                if outcome < 0.25:
                    continue

                answers = []
                for _ in range(random.randint(1, 3)):
                    candidates = [u for u in demo_users if u.id != author.id]
                    answer_author = random.choice(candidates)
                    answer = Answer.objects.create(
                        body=random.choice(ANSWER_TEMPLATES).format(dept=dept_name),
                        author=answer_author, question=question,
                    )
                    answers.append(answer)

                    for _ in range(random.randint(0, 2)):
                        voter_candidates = [u for u in demo_users if u.id != answer_author.id]
                        voter = random.choice(voter_candidates)
                        vote_type = random.choice(
                            [AnswerVote.VoteType.UP, AnswerVote.VoteType.UP, AnswerVote.VoteType.DOWN]
                        )
                        vote, created = AnswerVote.objects.get_or_create(
                            answer=answer, user=voter, defaults={"vote_type": vote_type}
                        )
                        if created:
                            delta = 1 if vote_type == AnswerVote.VoteType.UP else -1
                            Answer.objects.filter(id=answer.id).update(vote_score=answer.vote_score + delta)
                            answer.refresh_from_db(fields=["vote_score"])

                    if random.random() < 0.5:
                        for _ in range(random.randint(1, 2)):
                            Comment.objects.create(
                                body=random.choice(COMMENT_TEMPLATES),
                                author=random.choice(demo_users), answer=answer,
                            )

                Question.objects.filter(id=question.id).update(status=Question.Status.ANSWERED)

                if outcome > 0.55:
                    best = max(answers, key=lambda a: a.vote_score)
                    Answer.objects.filter(id=best.id).update(is_best=True)
                    Question.objects.filter(id=question.id).update(status=Question.Status.SOLVED)

        return all_questions

    def _add_follows_and_locks(self, questions, demo_users):
        if not questions:
            return

        self.stdout.write("Adding question follows and a couple of locked questions...")

        for question in questions:
            if random.random() < 0.3:
                follower_candidates = [u for u in demo_users if u.id != question.author_id]
                for follower in random.sample(follower_candidates, k=min(random.randint(1, 3), len(follower_candidates))):
                    QuestionFollow.objects.get_or_create(user=follower, question=question)

        answered_or_solved = [q for q in questions if q.status != Question.Status.OPEN]
        for question in random.sample(answered_or_solved, k=min(2, len(answered_or_solved))):
            Question.objects.filter(id=question.id).update(is_locked=True)

    def _create_reports(self, demo_users):
        self.stdout.write("Creating sample reports across every status...")
        sample_questions = list(Question.objects.order_by("?")[:3])
        if not sample_questions:
            return

        content_type = ContentType.objects.get_for_model(Question)
        statuses_and_types = [
            (Report.Status.PENDING, Report.ReportType.SPAM, None, None),
            (Report.Status.RESOLVED, Report.ReportType.DUPLICATE, demo_users[0], timezone.now()),
            (Report.Status.REJECTED, Report.ReportType.MISINFORMATION, demo_users[0], timezone.now()),
        ]

        for question, (status, report_type, resolved_by, resolved_at) in zip(sample_questions, statuses_and_types):
            Report.objects.get_or_create(
                reporter=demo_users[-1], content_type=content_type, object_id=question.id,
                defaults={
                    "type": report_type,
                    "description": "Seeded sample report for testing the moderation dashboard.",
                    "status": status,
                    "resolved_by": resolved_by,
                    "resolved_at": resolved_at,
                },
            )

    def _create_static_pages(self, demo_users):
        self.stdout.write("Creating static pages...")
        author = User.objects.filter(is_admin=True).first() or demo_users[0]
        for page_data in STATIC_PAGE_DATA:
            StaticPage.objects.get_or_create(
                title=page_data["title"],
                defaults={
                    "body": page_data["body"],
                    "visibility": page_data["visibility"],
                    "is_published": page_data["is_published"],
                    "created_by": author,
                },
            )