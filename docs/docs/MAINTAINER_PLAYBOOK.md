# Maintainer Playbook (Internal)

This is for Mr Nova, not contributors. It's the operating rhythm that keeps
Academia's collaboration running without needing a fresh decision every time
something routine comes up. Revisit and adjust this as the project grows,
it's a starting point, not a fixed rulebook.

## The weekly rhythm

Pick one recurring slot, 30 to 45 minutes, same time each week if possible.
Contributors will eventually learn to expect activity around that time,
which is more valuable than being reachable constantly.

**During that slot:**
1. Triage new issues, apply labels, move anything genuinely ready into the
   `Ready` project board column.
2. Check the `Task Board` group for stale claims (see below).
3. Review any open pull requests waiting on you.
4. If `develop` has accumulated a few confirmed-working merges, merge it
   into `main` (this is the actual production release).
5. If the `Ready` column is getting thin, spend 10 minutes grooming
   `docs/contributor-backlog.md` and promote one or two more items.
6. Post a short recap in Announcements (see template below).

You do not need to be responsive outside this slot. Setting that expectation
early, gently, protects you from burnout and is completely normal for open
source maintainers.

## Triaging a contributor-opened issue

When someone opens an issue themselves (rather than you posting one from
`contributor-backlog.md`):
1. Confirm it's real and reproducible, or ask a clarifying question on the
   issue if it isn't clear yet.
2. Apply labels (`bug`/`enhancement`, plus `frontend`/`backend`, plus either
   `good-first-issue` or `needs-decision`).
3. If it needs a design or scope decision from you first, leave it labeled
   `needs-decision` and don't let it get claimed yet, note in a comment what
   you're waiting to decide.
4. Once it's genuinely ready, either let it sit in `Ready` for anyone to
   claim, or post it directly in the Task Board group yourself if you want
   it picked up quickly (useful if the person who reported it wants to fix
   it themselves and is waiting).

## Assigning a claimed issue

This is the step that turns a WhatsApp "claiming" reply into a real,
trackable claim:
1. When someone comments "I'd like to work on this" on an issue (after
   claiming it in Task Board), open the issue and add them as the Assignee
   (right sidebar, "Assignees").
2. If two people comment on the same issue, the first one to comment gets
   it, reply on the issue to confirm and let the other person know it's
   taken (and point them at what else is open, so they don't just leave).
3. That's it, the project board should move it to `In Progress`
   automatically once assigned, if you set up that workflow automation in
   Step 2.

Since contributors work from forks (not direct branches on the main repo),
their pull requests will show up as "from fork" when they open one, that's
expected, not a configuration problem.

## Handling stale claims

If someone claims a task and goes quiet:
- After about 5 to 7 days with no update, reply on the task thread with a
  friendly check-in ("hey, still working on this one, or should we open it
  back up?"). People get busy, this isn't an accusation.
- No response after another few days: release the task back to the pool,
  reply "opening this back up for anyone else" and remove their claim.
- Never let a task sit claimed-but-dead for weeks, it quietly discourages
  everyone else from touching it and shrinks your available pool for no
  reason.

## Reviewing pull requests

You're new to this too, so a simple standard: does it do what the issue
asked, does it match the relevant doc (api-contract.md, project-overview.md,
etc.), does it look like it was actually tested. That's enough of a bar for
small, well-scoped tasks.

When leaving feedback:
- Be specific and kind. "This works, but can you move this logic into the
  existing helper function instead of duplicating it?" lands much better
  than "this isn't right."
- If it's basically fine with one small issue, approve with a comment asking
  for the fix, don't block the whole PR over something minor, that's
  discouraging for a new contributor and slows everything down.
- If it's genuinely off track, say so plainly but constructively, and offer
  a pointer toward the right direction, not just "no."
- It's fine to just fix a tiny thing yourself after merging rather than
  bouncing a PR back and forth over something trivial like a typo.

## Keeping people engaged

- **Public credit, every time.** When a PR merges, say so in Announcements
  with the contributor's name and what they fixed, even if it's small.
  This costs you thirty seconds and is the single highest-leverage thing
  you can do for retention.
- **Never let the `Ready` column run dry.** If someone finishes a task and
  there's nothing else ready to claim, they drift away. Groom the backlog
  before it becomes urgent, not after someone asks "is there anything else
  to do?"
- **Vary task difficulty on purpose.** Once someone's done two or three
  `good-first-issue` tasks, start offering them something `intermediate`,
  people stay engaged when they can feel themselves leveling up.
- **A small monthly recap.** Even a short post ("this month: 6 tasks
  closed, welcome to 2 new contributors, here's what's next") makes people
  feel like they're part of something moving forward, not just doing
  scattered favors.

## Weekly recap template (for Announcements)

```
Week recap 🛠️
✅ Merged: [task names, credit the contributor]
🚧 In progress: [task names, who's on them]
🆕 New tasks up in Task Board: [names]
Thanks everyone, great week.
```

## Promoting develop to main (the actual release)

`develop` accumulates merged PRs continuously. `main` only changes when you
deliberately decide a batch of `develop` changes is ready to go live, that
decision is yours, not automatic, and not tied to any fixed schedule.

**Signs it's a good time to promote:**
- A handful of PRs have merged into `develop` (there's no magic number,
  think in terms of "a meaningful, coherent batch," not "every single
  merge").
- You've clicked through the `develop` Vercel preview yourself and the
  merged changes work individually and together, no visual regressions,
  no broken flows.
- Nothing currently in `develop` is a half-finished or experimental change
  you're not ready to ship (this shouldn't happen if PRs stay small and
  scoped, but double-check).
- There's no open, known bug in `develop` that you'd be knowingly shipping.

Don't wait for a large batch out of a sense that releases should be
substantial, small, frequent releases are healthier than big infrequent
ones, they make it obvious which release introduced a problem if one shows
up.

**How to actually do it:**
1. Open a pull request on GitHub, base `main`, compare `develop`.
2. Review the diff yourself, this is your natural checkpoint to see
   everything that changed since the last release in one place.
3. Merge it. Branch protection means this goes through the same squash-merge
   button as every other PR, that's fine, a single squash commit on `main`
   summarizing "release: profile mobile fix, sidebar separator, loading bar"
   is a clean, readable release history, exactly what you want `main`'s
   commit log to look like over time.
4. Merging triggers the live Vercel production deployment automatically,
   since Production Branch is set to `main`.
5. Optional, not required: tag it (`git tag v0.2.0 && git push origin
   v0.2.0`) if you want a marker to refer back to later. Skip this
   entirely if it feels like unnecessary ceremony at this stage, it adds
   no functional value on its own.

After merging, `develop` and `main` are back in sync, keep accepting new PRs
into `develop` as normal.

## When to bring in a co-maintainer

Consider giving someone merge rights (not just contributor status) once
they've had multiple PRs merged cleanly, shown good judgment in how they
communicate, and you'd trust their review of someone else's PR. This isn't
urgent, but as the task volume grows, reviewing everything yourself forever
doesn't scale. When you get there, GOVERNANCE.md already leaves room for
this, it just needs you to update it with the specifics when it happens.

## When to move to Google Chat

You already know the reasoning from earlier. Practical signal for when it's
worth the switch: when WhatsApp's lack of threading starts actually costing
you time, multiple simultaneous tasks getting confused, hard to find old
context, that's the moment, not a fixed date. Until then, WhatsApp is doing
its job.

## Things that don't need a decision every time

A few standing defaults, so you don't have to reason from scratch each time:
- Bug reports from real users always outrank new feature requests in triage.
- If a proposed change isn't in `feature-list.md` or `contributor-backlog.md`
  and isn't a bug, default answer is "let's discuss it in an issue first,"
  not an immediate yes or no.
- Anything touching `api-contract.md` or `database-schema.md`'s documented
  shape needs your sign-off before work starts, no exceptions, even for a
  trusted contributor, since it's a contract the frontend depends on.
- Small, purely cosmetic PRs (typo fixes, minor copy changes) don't need the
  full weekly review cycle, merge those whenever you see them.

## If something feels off

Trust that instinct. Most collaboration problems (someone dominating
discussion, a PR that feels like scope creep, a tone that's drifting
unkind) are much easier to address early and gently than after they've
become a pattern. CODE_OF_CONDUCT.md exists so you have something concrete
to point to if a conversation ever needs it, most of the time a quiet direct
message solves it before it needs to go there.
