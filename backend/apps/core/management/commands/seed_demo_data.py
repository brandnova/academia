import random

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


class Command(BaseCommand):
    help = (
        "Seed the database with demo content for frontend development and testing. "
        "Safe to run repeatedly without --clear, existing schools/departments/tags "
        "are reused, new questions/answers/comments/pages are added on top each run."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--users", type=int, default=15,
            help="Number of demo users to create in addition to any existing users.",
        )
        parser.add_argument(
            "--clear", action="store_true",
            help=(
                "Wipe existing seeded content (schools, hubs, questions, answers, "
                "tags, reports, notifications, static pages, role assignments) "
                "before seeding fresh. User accounts are always preserved, "
                "re-authenticating via Google or re-running createsuperuser is "
                "not something this flag should force on you."
            ),
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_content()
            self.stdout.write(self.style.SUCCESS("Cleared existing seeded content."))
        elif School.objects.exists():
            self.stdout.write(
                "Existing content found, adding new demo content on top "
                "(pass --clear first if you want a fresh dataset instead)."
            )

        with transaction.atomic():
            users = self._create_users(options["users"])
            schools = self._create_schools()
            hubs = self._activate_hubs(schools, users)
            self._create_departments(schools)
            self._assign_roles(hubs, users)
            tags = self._create_tags()
            questions = self._create_questions_and_answers(hubs, users, tags)
            self._add_follows_and_locks(questions, users)
            self._create_reports(users)
            self._create_static_pages(users)

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    def _clear_content(self):
        self.stdout.write("Clearing existing seeded content (user accounts are preserved)...")
        Notification.objects.all().delete()
        Report.objects.all().delete()
        StaticPage.objects.all().delete()
        # School cascades Hub, Department, HubActivationRequest, Question, Answer,
        # Comment, AnswerVote, QuestionTag, QuestionFollow, ModeratorAssignment,
        # SchoolRepresentativeAssignment, per database-schema.md's Cascade Behavior.
        School.objects.all().delete()
        Tag.objects.all().delete()  # not tied to School, must clear separately

    def _create_users(self, count):
        self.stdout.write("Creating demo users...")
        users = list(User.objects.all())
        for i in range(count):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            email = f"{first.lower()}.{last.lower()}{i}@example.com"
            user, created = User.objects.get_or_create(
                email=email, defaults={"full_name": f"{first} {last}"},
            )
            if created:
                user.set_unusable_password()
                user.save()
            users.append(user)
        return users

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

    def _activate_hubs(self, schools, users):
        self.stdout.write("Activating hubs for most schools, leaving a couple unclaimed...")
        hubs = []
        activatable = schools[:-2]
        pending_only_school = schools[-2]
        unclaimed_school = schools[-1]
        requester = users[0]

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

    def _assign_roles(self, hubs, users):
        """Gives the admin dashboard something to show by default, without
        requiring manual role assignment before it's useful to look at."""
        if not hubs or len(users) < 3:
            return
        self.stdout.write("Assigning a representative and moderator to the first hub...")
        first_hub = hubs[0]
        SchoolRepresentativeAssignment.objects.get_or_create(hub=first_hub, user=users[1])
        ModeratorAssignment.objects.get_or_create(hub=first_hub, user=users[2])

    def _create_tags(self):
        self.stdout.write("Creating tags...")
        return [Tag.objects.get_or_create(name=name)[0] for name in TAGS_POOL]

    def _create_questions_and_answers(self, hubs, users, tags):
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
                author = random.choice(users)

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
                    candidates = [u for u in users if u.id != author.id]
                    answer_author = random.choice(candidates)
                    answer = Answer.objects.create(
                        body=random.choice(ANSWER_TEMPLATES).format(dept=dept_name),
                        author=answer_author, question=question,
                    )
                    answers.append(answer)

                    for _ in range(random.randint(0, 2)):
                        voter_candidates = [u for u in users if u.id != answer_author.id]
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
                                author=random.choice(users), answer=answer,
                            )

                Question.objects.filter(id=question.id).update(status=Question.Status.ANSWERED)

                if outcome > 0.55:
                    best = max(answers, key=lambda a: a.vote_score)
                    Answer.objects.filter(id=best.id).update(is_best=True)
                    Question.objects.filter(id=question.id).update(status=Question.Status.SOLVED)

        return all_questions

    def _add_follows_and_locks(self, questions, users):
        if not questions:
            return

        self.stdout.write("Adding question follows and a couple of locked questions...")

        for question in questions:
            if random.random() < 0.3:
                follower_candidates = [u for u in users if u.id != question.author_id]
                for follower in random.sample(follower_candidates, k=min(random.randint(1, 3), len(follower_candidates))):
                    QuestionFollow.objects.get_or_create(user=follower, question=question)

        answered_or_solved = [q for q in questions if q.status != Question.Status.OPEN]
        for question in random.sample(answered_or_solved, k=min(2, len(answered_or_solved))):
            Question.objects.filter(id=question.id).update(is_locked=True)

    def _create_reports(self, users):
        self.stdout.write("Creating sample reports across every status...")
        sample_questions = list(Question.objects.order_by("?")[:3])
        if not sample_questions:
            return

        content_type = ContentType.objects.get_for_model(Question)
        statuses_and_types = [
            (Report.Status.PENDING, Report.ReportType.SPAM, None, None),
            (Report.Status.RESOLVED, Report.ReportType.DUPLICATE, users[0], timezone.now()),
            (Report.Status.REJECTED, Report.ReportType.MISINFORMATION, users[0], timezone.now()),
        ]

        for question, (status, report_type, resolved_by, resolved_at) in zip(sample_questions, statuses_and_types):
            Report.objects.get_or_create(
                reporter=users[-1], content_type=content_type, object_id=question.id,
                defaults={
                    "type": report_type,
                    "description": "Seeded sample report for testing the moderation dashboard.",
                    "status": status,
                    "resolved_by": resolved_by,
                    "resolved_at": resolved_at,
                },
            )

    def _create_static_pages(self, users):
        self.stdout.write("Creating static pages...")
        author = User.objects.filter(is_admin=True).first() or users[0]
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