# Managing people in SportsWeb One

A plain-English guide for committee members and admins. It explains how the
people side of SportsWeb One works, how to add someone, and what each part of a
person's profile means. We'll keep this in step with the build as screens go live.

---

## The big idea: one person, many roles

SportsWeb One is built around a single **People Database**. Every person
connected to the club — player, parent, coach, volunteer, committee member,
sponsor contact — exists **once**, and everything about them links back to that
one profile.

You should never have to ask "is John in the player spreadsheet, the parent
list, the coaching folder or the committee records?" John exists once, and his
roles, family links, history, payments and compliance all hang off that one
record.

> **Why this matters:** the club builds a complete, living picture of each
> person over time, instead of disconnected lists that get rebuilt every season.

---

## What's on a person's profile

| Part | What it holds |
| --- | --- |
| **Details** | Name, email, mobile, date of birth, emergency contact, notes, tags |
| **Roles** | Every role they hold or have held (see below) — with sport, team, season and dates |
| **Relationships** | Family and guardian links (parent ↔ child, emergency contact, etc.) |
| **Compliance** | WWCC, RSA, first-aid, coaching accreditation — with expiry dates |
| **Registrations** | Season-by-season registration + payment status |
| **History** | Teams, seasons, milestones and contributions over time (built up over seasons) |

---

## Roles: the heart of the model

A person can hold **many roles**, and each role is its own record with a
**start date, end date, status, and optional sport / team / season**. That means
history is preserved — old seasons aren't overwritten.

**Example — Emily Brown:**

- 2020 — Under 14 player
- 2023 — Senior player
- 2024 — Senior player **and** junior assistant coach
- 2025 — Senior player, coach **and** committee member

All of those stay on her profile as her club timeline.

**Available role types:** `player`, `past_player`, `parent`, `guardian`,
`coach`, `assistant_coach`, `team_manager`, `volunteer`, `committee`,
`sponsor_contact`, `official`, `trainer`, `life_member`, `administrator`.

> **Note on access vs roles:** a "committee" role describes what someone *does*
> at the club. Whether they can *log in and administer* SportsWeb One is a
> separate **access level** (Exec Admin / Admin), set on the People &
> committee screen. The two are kept apart on purpose, for security.

---

## Family & guardian links

For junior clubs, parents and guardians are **real people in the database**, not
just contact fields on a child's record.

- A junior player links to one or more parents/guardians.
- A parent can link to several children.
- That same parent might also be a volunteer, team manager or sponsor contact —
  all on the one profile.

This is what lets the club message "all Under 13 parents" or "the Jones family"
accurately, without rebuilding contact lists each season.

---

## Compliance (WWCC and friends)

Compliance records live **on the person**, with an expiry date and a status
(`pending`, `valid`, `expiring`, `expired`). Because they're attached to the
person, the club can answer questions like:

- Which coaches have a current WWCC?
- Whose WWCC expires in the next 60 days?
- Which volunteers are cleared for junior roles?

> **Privacy:** compliance, medical and financial information is restricted to
> committee/admin level — ordinary club logins can't see it.

---

## How to add a member

There are two paths, depending on who you're adding.

### 1. A committee member who needs to log in

Use **People & committee** in the sidebar → **Add a committee member**. You set
their name, email, **access level** (Exec Admin or Admin) and committee title.
They get an invite and, once they accept, can log in.

### 2. A general member (player, parent, volunteer, sponsor contact)

These are people who don't necessarily log in. They're managed on the
**Members** screen (rolling out in this phase). Adding a member captures:

1. **Details** — name, email/mobile, date of birth, emergency contact.
2. **Role(s)** — pick one or more (e.g. *player* + *parent*), and where it
   applies (sport / team / season).
3. **Relationships** — link a junior to their parent/guardian.
4. **Compliance** — record a WWCC or accreditation if the role needs one.

### 3. People sign up themselves via the club website

Players, parents and volunteers can **register online** from the club's public
site (a "Join the club" / "Volunteer with us" form). A sign-up creates — or
matches to — a person record, attaches the requested role, and lands as a
**pending** entry for the committee to approve. Nothing self-grants admin access,
and approval keeps the database clean.

### 4. Bulk import & external platforms

You can **bulk import** from a spreadsheet/CSV, and pull from **PlayHQ / GameDay**
where available. Imports match each row to an existing person (or create a new
one), so the central database fills out without manual re-keying.

---

## How imports behave (this matters)

Imports are **non-destructive**. When an import matches an existing person:

- It **never overwrites** what the club has entered — names, contact details,
  roles, family links, notes and compliance are protected.
- It **only refreshes external-sourced data** — things like playing stats, games
  played, appearances and results, which come from PlayHQ/GameDay and are tagged
  to their source.
- Anything it can't confidently match is **queued for review**, not merged blindly
  (wrongly merging two people is hard to undo).

So PlayHQ can keep a player's *game tally* up to date, while the club's own
information about that person stays exactly as the club set it.

---

## Adding things that affect a profile

- **Give someone a new role** → add a role record (e.g. promote a player to
  *assistant_coach* for a team/season). Their old roles stay as history.
- **Link a family member** → add a relationship (parent_of / guardian_of).
- **Record compliance** → add a compliance record with an expiry date.
- **Register them for a season** → creates a registration with payment status.

Each of these is a separate record that links back to the one person — so the
profile grows over time without anything being lost or duplicated.

---

## Golden rules

1. **One person, one record.** Never create a second profile for someone who's
   already in the system — add a role or relationship instead.
2. **Don't overwrite history.** Ending a role (end date + status) keeps the
   record; it doesn't delete the past.
3. **Right info, right people.** Medical, financial and child-related details are
   permission-gated — only share what a role needs.
