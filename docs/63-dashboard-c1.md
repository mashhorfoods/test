# C1 — the four dashboard questions, answered

Written 5 September 2026. `docs/62` §C1. The four questions in `docs/36` §4
have been open since that document was written and have never been answered;
answering them is what decides whether a dashboard is a weekend, a product, or
unnecessary.

**What kind of answer each question gets, stated up front:**

| | Question | Answerable by |
| --- | --- | --- |
| Q1 | Who logs in, and from where? | **The owner.** Evidence narrows it; only you know if a second person is coming |
| Q2 | What changes — prices, or pages? | **Measured.** The repository answers this outright |
| Q3 | Does the build still run? | **Architecture.** And the answer changed since `docs/36` §4 was written |
| Q4 | Where does it live? | **Architecture,** conditional on Q1 |

---

## Q2 first, because it is the only one with hard evidence

*What changes — prices, or pages?*

121 commits, three weeks, the whole life of the project:

| | Count | Share |
| --- | ---: | ---: |
| Commits with a file change | 121 | — |
| Commits touching `src/data/` at all | 19 | 16% |
| **Commits changing nothing but data** (+ generated output and docs) | **6** | **5%** |

**Six commits in the project's entire history could have been produced by a
form over the data files.** And they were all on **one day** — 4 September —
five of them the Arabic translation push and the sixth yesterday's branding
reprice. There is no recurring content-editing load in this repository. There
has been one burst, once.

The other 13 data commits each needed code alongside them, and the pattern is
consistent enough to be a rule:

> **Changing a value needs no code. Adding a kind of information does.**

Repricing Branding was three fields and nothing else. Adding *"what the price
buys"* to every card touched `pricing.css` and `build-pricing.js` too, because
a new field has to be rendered by something. A dashboard covers the first kind
completely and the second kind not at all.

**So: prices, not pages** — and prices change about as often as this list
suggests, which is rarely.

## Q3 — Does the build still run?

**Yes, and this answer changed on 4 September.** `docs/36` §4 was written when
there was no CI, so "a dashboard that writes data but cannot trigger a build
has only moved the problem" was a serious objection. `.github/workflows/check.yml`
now builds and runs all three harnesses on every push, which removes most of it.

**But not all of it, and the remainder is specific.** CI currently *verifies*
that the committed `dist/` matches a fresh build; it does not *produce* it. A
commit that changed only `pricing.json` would therefore go red — verified by
doing it:

```
--- simulating a form that commits ONLY the data file, then CI runs ---
CI step 7 would FAIL — dist is stale, exactly as designed
```

That is the check doing its job, and it is also the one concrete piece of work
any data-editing route needs: **CI has to build and commit `dist/` back for
data-only commits, not merely check it.** Roughly ten lines of workflow, and it
is the same ten lines whichever option below is chosen.

Deployment stays manual either way — `docs/61` AD-07, unchanged. A dashboard
that edits content does not imply a pipeline that publishes it.

## Q1 — Who logs in, and from where?

**Today: one person, on one laptop, who already has full repository access.**
`docs/60` §4 states it plainly — the owner is the designer, the developer, the
content author and the approver. There is no second person, no shared device,
and no account that would need creating.

That matters more than it sounds, because **a login only earns its keep when
somebody needs to change content *without* being trusted with the repository.**
Right now nobody is in that position, so an authentication system would be
protecting a door that only one person walks through, and that person already
has the key.

**This is the question only you can answer, and it is the one that decides the
other three:**

> Is a second person going to edit content — and should they be kept out of the
> repository when they do?

- **No, or not yet** → Option 0 below. Nothing to build.
- **Yes** → Option 1. That is also `docs/36` §4's first stated trigger, arriving
  exactly as predicted.
- **Yes, and on shared or untrusted devices** → the security surface changes
  shape, and Option 2 becomes a real conversation.

## Q4 — Where does it live?

Three honest options. Ordered by cost, which is also the order they should be
considered in.

### Option 0 — GitHub is already the dashboard · £0, nothing to build

Edit `src/data/pricing.json` in GitHub's web editor, commit, CI builds and
checks. It works from a phone.

| | |
| --- | --- |
| **Auth** | Already exists, already yours, and gains 2FA the moment `docs/62` A1 is done |
| **Audit trail** | Every change already has an author, a timestamp and a diff |
| **Attack surface** | **Zero new.** No server, no session, no token in a browser. AD-01 survives intact |
| **Cost** | Nothing |
| **The catch** | You are editing JSON. A missing comma is a broken build — caught by CI, but caught *after* you press commit |

**This is the honest answer for one technical maintainer**, and it is available
today with no work beyond Q3's ten lines.

### Option 1 — A git-backed CMS · a weekend, still no server of your own

Decap, Sveltia or similar: a static admin page, GitHub OAuth, form fields
instead of raw JSON, commits to the same repository. The site stays static; the
data stays in git; CI still verifies everything.

| | |
| --- | --- |
| **Auth** | GitHub OAuth. Needs a small token broker, or a provider that hosts one |
| **What it buys** | Someone who should not see the repository gets labelled fields and validation instead of a JSON file |
| **Attack surface** | One OAuth broker. Real, but small, and it never touches the live site |
| **Cost** | A weekend, and the broker is free at this scale |
| **When it is right** | The moment Q1's answer becomes "yes, a second person" |

This is `docs/36` §4's *"cheapest honest version"* — a form that edits
`pricing.json` and commits it — with the detail filled in.

### Option 2 — A real dashboard with its own auth and storage

Its own login, its own database, its own host.

**What it costs, and this is the part to weigh rather than skim:**

- **It ends AD-01**, the zero-backend decision. `docs/58` §3 — the table of
  attack surfaces that do not exist *because* there is no server — stops being
  true, and §7 says to rewrite the threat model that day.
- `docs/57` §8 says the same about the backup plan. No database today; a
  database means real backups, tested restores, and a plan that currently says
  it does not need to exist.
- Static hosting cannot run it. This is the item that starts a hosting bill and
  a patching obligation.
- Sessions, password resets, and an account that can change what visitors see —
  a new T-number in the threat model, above most of what is there now.

**Nothing about this is an argument against it.** It is the price, and it is
worth paying the moment the thing being built is genuinely dynamic — bookings,
stock, accounts, an enquiry record with a status. `docs/36` §4's third and
fourth triggers are precisely that.

---

## The answers, in one table

| | Question | Answer |
| --- | --- | --- |
| **Q1** | Who logs in, from where | **One person, one laptop, already has repo access.** No second person exists today — **owner to confirm whether one is coming** |
| **Q2** | Prices or pages | **Prices.** Measured: 6 of 121 commits were data-only, all on one day. Changing a value needs no code; adding a kind of information does |
| **Q3** | Does the build still run | **Yes — and CI now does it.** One gap: CI must build *and commit* `dist/` for data-only commits, ~10 lines. Deployment stays manual |
| **Q4** | Where does it live | **Nowhere new, for now.** GitHub's own editor is a working dashboard today at zero cost. A git-backed CMS the day a second person needs it. A real dashboard only when something becomes genuinely dynamic |

## Recommendation

**Do Option 0, and do only the ten lines of CI that make it work.**

The evidence is one-sided: one editor, who has the keys, editing prices six
times in three weeks — all on a single day. Against that, a login screen is
infrastructure protecting a door with one key-holder, and a real dashboard
trades away the architectural property that most of this project's security
rests on.

**What would change this answer**, each mapping to a trigger already written in
`docs/36` §4:

| If this becomes true | Then |
| --- | --- |
| A second person edits content and should not have the repository | **Option 1**, that week |
| Edits become weekly rather than occasional | **Option 1** — JSON-by-hand stops being reasonable at that rate |
| Enquiries outgrow a WhatsApp inbox and need a record with a status | **Option 2** — and note that is a CRM, not a CMS |
| Something becomes genuinely dynamic — bookings, stock, accounts | **Option 2**, and `docs/58` §7 fires |

## Decided, 5 September 2026

**Option 0, one person only.** The owner answered Q1 — no second content
editor — and took the recommendation.

**What that means in practice.** Edit `src/data/*.json` in GitHub's web editor,
from anything including a phone. CI classifies the push as data-only, runs all
three harnesses, and only then rebuilds and commits `dist/` back. The upload
archive is attached to the run, so it can be downloaded without a terminal.
Deployment stays a manual upload — `docs/61` AD-07 — which is the one step that
was never meant to be automated.

**It was tested rather than reasoned about**, on the live branch: a price
edited and pushed with no local build, then reverted. Both pushes produced a
bot commit carrying a correct rebuild, and the price is back where it started.
The commit-back is the part that could not be verified any other way, and it is
the part that would next have run when the owner edited a price from a phone.

**Nothing else in §C is outstanding.** C2 and C3 are moot under Option 0;
`docs/36` §4's four triggers remain the route back, and each is mapped above to
the option it would move to.

## What was still needed from the owner

Two things, and they are both short:

1. **Answer Q1.** Is a second content editor coming, and should they be kept
   out of the repository? Everything above turns on it.
2. **Confirm or reject the recommendation.** If Option 0, C2 is already
   answered and C3 shrinks to the ten lines of CI. If Option 1, C2 becomes a
   real costing exercise and I can do it. If Option 2, C3 is a scoping
   engagement and the threat model and backup plan are rewritten with it.

Until then **nothing is being built**, which is the same position `docs/36` §4
took — but now with the questions answered rather than open.
