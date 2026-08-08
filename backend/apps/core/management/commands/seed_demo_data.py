"""
Test with both real users
python manage.py seed_demo_data --clear --user YOUR_ACTUAL_GMAIL@gmail.com --second-user YOUR_SECOND_ACCOUNT@gmail.com
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
    ("University of Lagos", "UNILAG", "Lagos, Nigeria"),
    ("University of Ibadan", "UI", "Ibadan, Nigeria"),
    ("Obafemi Awolowo University", "OAU", "Ile-Ife, Nigeria"),
    ("Ahmadu Bello University", "ABU", "Zaria, Nigeria"),
    ("University of Nigeria, Nsukka", "UNN", "Nsukka, Nigeria"),
    ("Federal University of Technology, Akure", "FUTA", "Akure, Nigeria"),
    ("Lagos State University", "LASU", "Lagos, Nigeria"),
    ("Covenant University", "CU", "Ota, Nigeria"),
    ("University of Benin", "UNIBEN", "Benin City, Nigeria"),
    ("Nnamdi Azikiwe University", "UNIZIK", "Awka, Nigeria"),
    ("Bayero University Kano", "BUK", "Kano, Nigeria"),
    ("Federal University of Technology, Minna", "FUTMINNA", "Minna, Nigeria"),
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


class Command(BaseCommand):
    help = (
        "Seed the database with demo content for frontend development and testing. "
        "Safe to run repeatedly without --clear, demo users/schools/departments/tags "
        "are reused (deterministic), new questions/answers/comments/pages are added "
        "on top each run."
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
                "tags, reports, notifications, static pages, role assignments) AND "
                "demo user accounts (only ones matching the deterministic demoNNN@"
                "example.com pattern this command generates) before seeding fresh. "
                "Real accounts (your superuser, any Google-authenticated account, "
                "anything passed via --user/--second-user) are never touched."
            ),
        )
        parser.add_argument(
            "--user", type=str, default=None,
            help=(
                "Email of an existing real user account (already created via Google "
                "login or createsuperuser) to seed as a hub representative and "
                "moderator, with authored content and a few varied notifications. "
                "Must already exist, this command will not create it."
            ),
        )
        parser.add_argument(
            "--second-user", type=str, default=None,
            help=(
                "Email of a second existing real user account, folded in as a "
                "supporting participant (answers/comments/votes on the --user "
                "account's content). Lighter treatment than --user: no role "
                "assignment, no dedicated notifications, just real interaction data."
            ),
        )

    def handle(self, *args, **options):
        primary_user = self._get_real_user(options.get("user"), "Primary user (--user)")
        secondary_user = self._get_real_user(options.get("second_user"), "Secondary user (--second-user)")

        if options["clear"]:
            self._clear_content()
            self._clear_demo_users()
            self.stdout.write(self.style.SUCCESS("Cleared existing seeded content and demo users."))
        elif School.objects.exists():
            self.stdout.write(
                "Existing content found, adding new demo content on top "
                "(pass --clear first if you want a fresh dataset instead)."
            )

        with transaction.atomic():
            demo_users = self._create_demo_users(options["users"])
            schools = self._create_schools()
            hubs = self._activate_hubs(schools, demo_users)
            self._create_departments(schools)
            self._assign_roles(hubs, demo_users)
            self._assign_real_user_roles(hubs, primary_user)
            tags = self._create_tags()
            questions = self._create_questions_and_answers(hubs, demo_users, tags)
            self._add_follows_and_locks(questions, demo_users)
            self._seed_real_user_activity(hubs, tags, demo_users, primary_user, secondary_user)
            self._create_reports(demo_users)
            self._create_static_pages(demo_users)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    def _get_real_user(self, email, label):
        if not email:
            return None
        try:
            return User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(
                f"{label}: no account found for '{email}'. This must already exist "
                f"(log in via Google or run createsuperuser first). Skipping."
            ))
            return None

    def _clear_content(self):
        self.stdout.write("Clearing existing seeded content...")
        Notification.objects.all().delete()
        Report.objects.all().delete()
        StaticPage.objects.all().delete()
        # School cascades Hub, Department, HubActivationRequest, Question, Answer,
        # Comment, AnswerVote, QuestionTag, QuestionFollow, ModeratorAssignment,
        # SchoolRepresentativeAssignment, per database-schema.md's Cascade Behavior.
        School.objects.all().delete()
        Tag.objects.all().delete()  # not tied to School, must clear separately

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
        for name, short_name, location in SCHOOL_DATA:
            school, _ = School.objects.get_or_create(
                short_name=short_name,
                defaults={
                    "name": name, "location": location,
                    "verification_status": School.VerificationStatus.VERIFIED,
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
        """Gives the admin dashboard something to show by default, using demo
        accounts, independent of whether a real --user was also provided."""
        if not hubs or len(demo_users) < 3:
            return
        self.stdout.write("Assigning a demo representative and moderator to the first hub...")
        first_hub = hubs[0]
        SchoolRepresentativeAssignment.objects.get_or_create(hub=first_hub, user=demo_users[1])
        ModeratorAssignment.objects.get_or_create(hub=first_hub, user=demo_users[2])

    def _assign_real_user_roles(self, hubs, primary_user):
        if not primary_user or not hubs:
            return
        first_hub = hubs[0]
        SchoolRepresentativeAssignment.objects.get_or_create(hub=first_hub, user=primary_user)
        ModeratorAssignment.objects.get_or_create(hub=first_hub, user=primary_user)
        self.stdout.write(
            f"  Assigned {primary_user.email} as representative and moderator "
            f"for {first_hub.school.short_name}."
        )

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
                    continue  # leave OPEN, no answers

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

    def _seed_real_user_activity(self, hubs, tags, demo_users, primary_user, secondary_user):
        if not primary_user:
            return

        self.stdout.write(f"Seeding activity for real user {primary_user.email}...")

        target_hubs = [h for h in hubs[:2] if h is not None]
        primary_questions = []

        for hub in target_hubs:
            departments = list(hub.school.departments.all())
            for _ in range(2):
                title_template, body_template = random.choice(QUESTION_TEMPLATES)
                department = random.choice(departments) if departments else None
                dept_name = department.name if department else hub.school.name
                question = Question.objects.create(
                    title=title_template.format(dept=dept_name),
                    body=body_template.format(dept=dept_name),
                    author=primary_user, hub=hub, department=department,
                    view_count=random.randint(0, 150),
                )
                primary_questions.append(question)
                for tag in random.sample(tags, k=min(random.randint(0, 2), len(tags))):
                    QuestionTag.objects.get_or_create(question=question, tag=tag)

        # Someone answers up to two of the primary user's questions -> NEW_ANSWER notifications
        answerers = [secondary_user] if secondary_user else []
        remaining = 2 - len(answerers)
        if remaining > 0 and demo_users:
            answerers += random.sample(demo_users, k=min(remaining, len(demo_users)))

        for question, answerer in zip(primary_questions, answerers):
            dept_name = question.department.name if question.department else question.hub.school.name
            answer = Answer.objects.create(
                body=random.choice(ANSWER_TEMPLATES).format(dept=dept_name),
                author=answerer, question=question,
            )
            Question.objects.filter(id=question.id).update(status=Question.Status.ANSWERED)
            notify(
                user=primary_user,
                notification_type=Notification.Type.NEW_ANSWER,
                message=f"{answerer.full_name} answered your question: '{question.title}'",
                content_object=question,
            )

        # Primary user answers an existing demo question and it gets marked best -> BEST_ANSWER
        other_question = Question.objects.exclude(author=primary_user).order_by("?").first()
        if other_question:
            primary_answer = Answer.objects.create(
                body=random.choice(ANSWER_TEMPLATES).format(dept=other_question.hub.school.name),
                author=primary_user, question=other_question,
            )
            Answer.objects.filter(question=other_question, is_best=True).update(is_best=False)
            Answer.objects.filter(id=primary_answer.id).update(is_best=True)
            Question.objects.filter(id=other_question.id).update(status=Question.Status.SOLVED)
            notify(
                user=primary_user,
                notification_type=Notification.Type.BEST_ANSWER,
                message=f"Your answer was marked as best on: '{other_question.title}'",
                content_object=other_question,
            )

        # Third notification, tied to the role assignment made in _assign_real_user_roles
        if target_hubs:
            notify(
                user=primary_user,
                notification_type=Notification.Type.MODERATOR_ASSIGNED,
                message=f"You've been assigned as a moderator and representative for {target_hubs[0].school.short_name}",
                content_object=target_hubs[0],
            )

        # Leave the oldest read, the rest unread, so read/unread state has both to test against
        oldest_notification = Notification.objects.filter(user=primary_user).order_by("created_at").first()
        if oldest_notification:
            Notification.objects.filter(id=oldest_notification.id).update(is_read=True)

        self.stdout.write(
            f"  Created {len(primary_questions)} questions and 3 varied notifications "
            f"for {primary_user.email}."
        )

        if secondary_user:
            # Deliberately lighter than primary_user's setup, see the --second-user
            # help text: this account is a supporting participant, not a second
            # full test identity with its own roles and notification batch.
            extra_question = Question.objects.exclude(author=primary_user).order_by("?").first()
            if extra_question and extra_question.answers.exists():
                answer_to_touch = extra_question.answers.order_by("?").first()
                Comment.objects.get_or_create(
                    body=random.choice(COMMENT_TEMPLATES), author=secondary_user, answer=answer_to_touch,
                )
                if answer_to_touch.author_id != secondary_user.id:
                    vote, created = AnswerVote.objects.get_or_create(
                        answer=answer_to_touch, user=secondary_user,
                        defaults={"vote_type": AnswerVote.VoteType.UP},
                    )
                    if created:
                        Answer.objects.filter(id=answer_to_touch.id).update(
                            vote_score=answer_to_touch.vote_score + 1
                        )
            self.stdout.write(f"  Added light supporting activity for {secondary_user.email}.")

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