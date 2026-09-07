# The admin dashboard — the plan, and the decision it reverses

**7 September 2026.** The owner asked for an admin dashboard, planned properly
and built to completion. This is the plan. It is written to be followed, and
every phase below has an acceptance test that either passes or does not.

---

## 0. What this reverses, stated plainly before anything is built

On **5 September** `docs/63` recommended **Option 0** — GitHub's web editor is
the dashboard — and the owner accepted it. On **6 September** `docs/85`
extended it to a second person with full repository access: *"nothing new to
build."*

**The owner has now asked for a dashboard.** That is theirs to decide and it is
being followed. What it costs is worth naming once, here, rather than
discovering later:

| | |
| --- | --- |
| **AD-01 — no backend** | **Survives.** See §1: there is still no server of ours |
| **`docs/58` threat model** | **Gains one entry.** A credential now exists in a browser. §5 is the mitigation and it is not hand-waving |
| **`docs/63`'s "catch" against Option 0** | This is the thing being fixed: *"You are editing JSON. A missing comma is a broken build — caught by CI, but caught **after** you press commit"* |

**The dashboard's whole justification is that last row.** If it does not
validate before committing, it is a worse GitHub editor and should not exist.

---

## 1. Which option, and why not the other two

`docs/63` costed three. This is **Option 1**, in the variant that needs no
broker.

| | Verdict |
| --- | --- |
| **Option 0** — GitHub web editor | Already shipped, stays as the fallback. Not removed |
| **Option 2** — real backend, own auth and storage | **Rejected.** It ends AD-01, starts a hosting bill and a patching obligation, needs real backups and a rewritten threat model — for a site whose data is five JSON files edited occasionally. `docs/63` names the triggers that would justify it (bookings, stock, accounts, an enquiry record). **None has fired** |
| **Option 1** — git-backed, no server | **Chosen** |

### The variant: a fine-grained token, not OAuth

`docs/63`'s Option 1 assumed OAuth, which *"needs a small token broker, or a
provider that hosts one."* A broker is a server. We do not want a server.

So instead: **the operator pastes a GitHub fine-grained personal access token**,
scoped to this one repository, `contents: read and write`, with an expiry.

| | OAuth + broker | Fine-grained PAT |
| --- | --- | --- |
| Server of ours | **Yes**, one | **None** |
| Setup for the operator | Click "sign in" | Create a token once, paste it |
| Revocation | Revoke the app | Revoke the token |
| Blast radius if stolen | Whatever the app was granted | **One repository, contents only, expires** |

The PAT is worse on convenience and **better on everything else**, and there
are two operators, both of whom already have repository access. Convenience is
the right thing to trade here.

---

## 2. What it edits — and what it deliberately does not

**Edits:** `src/data/pricing.json` (prices, package contents, delivery,
revisions) and `src/data/i18n-ar.json` (Arabic strings).

> **`challenge.json` was in this list and came out during P1, for a measured
> reason.** Both files above round-trip through `JSON.parse` →
> `JSON.stringify(…, null, 2)` **byte-identically**, so a dashboard write
> changes only what the operator changed. `challenge.json` does not: it carries
> blank lines between its top-level keys, placed by a person for readability,
> and re-serialising drops them. Every dashboard commit would then carry
> cosmetic noise the operator did not make and cannot see.
>
> Preserving them means a surgical text edit rather than a parse-and-write,
> which is a different and more fragile piece of software. Weighed against the
> need — the challenge asks one fixed question and nobody has asked to change
> it — it is not worth it. **Recorded here rather than quietly dropped.**

**Does not edit:** anything else. Not the markup, not the styles, not
`site.config.json`, not the story. A dashboard that can edit everything is a
dashboard that can break anything, and the failure mode it exists to prevent —
a broken build from a hand-edited file — comes back the moment it becomes a
general-purpose file editor.

**Never handles:** enquiries, leads, personal data. `docs/85` decided that and
nothing here changes it. The moment this site stores a person's details, the
threat model and the backup plan are different documents.

---

## 3. The phases

Each has an acceptance test. **A phase is not done until its test passes.**

| # | Phase | Acceptance test |
| --- | --- | --- |
| **P1** | **The schema, and one validator.** A file describing every editable field, and `admin-validate.js` — **one implementation of the data rules, imported by both the browser and the tests**, so §6.1 cannot happen quietly | `tools/admin-test.js`: every editable file round-trips byte-identically; the shipped data passes every rule; and each rule fails when its defect is reintroduced |
| **P2** | **The shell.** `admin.html` — static, dark, on the site's own tokens, `noindex`, out of the sitemap, linked from nowhere | It renders with no token, explains what it is, and asks for one. `qa` confirms noindex + not in sitemap + not linked |
| **P3** | **The credential.** Paste a fine-grained PAT; verify against `GET /user` and repo access; show what it can do and when it expires; `sessionStorage` by default, `localStorage` only on an explicit "remember on this device"; a Forget button that actually clears both | A bad token is rejected with a useful message. A good one shows the account name. Forget clears it and reloading asks again |
| **P4** | **Read.** Fetch each data file via the Contents API, render the schema's forms populated | Every field in `pricing.json` appears, in the right type of control, in both languages |
| **P5** | **Validate before commit — the reason this exists.** Mirror every rule `qa.js` enforces on the data, client-side, and refuse to commit while any fails | Introduce each class of error in the form; each is blocked with a message naming the field. **A commit cannot be made while invalid** |
| **P6** | **Write.** PUT the changed file with its `sha` and a real commit message | A change committed from the dashboard appears in the repository, authored by the token's owner, with a message naming what changed |
| **P7** | **What happens next.** Show the commit, the CI run, and in plain words that the site rebuilds itself | After committing, the page links the commit and reports the check run's state |
| **P8** | **The guards.** `qa` checks the admin page cannot leak: noindex, absent from the sitemap, unlinked, no token in the markup, and its own CSP | Each guard negative-tested by reintroducing the defect it was written for |
| **P9** | **Documentation.** `docs/89` runbook gains a section; `docs/63` and `docs/85` are amended with the reversal; `docs/58` gains the threat entry | The runbook is enough to use it without asking anyone |

---

## 4. The two technical facts that shape the build

### 4.1 The CSP is one header for the whole site

`tools/build-deploy.js` emits a single `Header set Content-Security-Policy`
covering every page, and it ends `connect-src 'self'` plus Plausible.

The dashboard must reach `https://api.github.com`. **Adding that to the global
policy would loosen every public page for the sake of one that visitors never
see.** So `.htaccess` gains a `<Files "admin.html">` block with its own policy —
scoped, and the only place `api.github.com` is ever permitted.

### 4.2 CI already does the second half

A data-only push is already classified, built, checked and committed back by
`.github/workflows/check.yml`. **The dashboard does not need to build
anything.** It changes one JSON file and stops; CI does the rest, exactly as it
does when the same file is edited in GitHub's web editor today.

That is the whole architecture: **the dashboard is a form that writes JSON to
git.** Everything downstream already exists and is already tested.

---

## 5. The credential, and an honest account of the risk

A token in a browser is a real credential and this section does not pretend
otherwise.

**What limits it:**

- **Fine-grained, one repository, `contents: read and write` only.** It cannot
  touch settings, secrets, Actions, other repositories, or the account.
- **An expiry is required** at creation. A leaked token dies on its own.
- **`sessionStorage` by default** — gone when the tab closes. `localStorage`
  only if the operator explicitly ticks "remember on this device", and the page
  says what that means in a sentence.
- **The page is `noindex`, out of the sitemap and linked from nowhere.**
- **The site's CSP already forbids inline script and off-origin script.** An
  injected script that could read the token has no way onto the page — and
  §4.1's scoped policy is the only place any external origin is allowed at all.

**What does not limit it:** if the operator's machine or browser profile is
compromised, so is the token — exactly as their logged-in GitHub session
already is. This does not create that exposure; it does not remove it either.

**The blast radius, stated:** an attacker with the token can commit to this
repository. CI would run, the harnesses would very likely fail the change, and
every commit carries an author and a diff. They could not reach the live host,
the domain, the analytics or any other repository.

---

## 6. What would make me stop and come back

Written before starting, so it is a rule and not a rationalisation:

1. **If P5 cannot be made to mirror `qa.js` honestly** — if the validation in
   the browser would drift from the validation in CI — the dashboard's whole
   justification fails, and Option 0 is better. Stop and say so.
2. **If the scoped CSP cannot be made to work** on this host, the page must not
   ship with a loosened global policy. Stop and say so.
3. **If any phase's acceptance test cannot be passed**, it does not get marked
   done and the next phase does not start.

---

## 7. What "finished" means

All nine phases pass their acceptance tests · the five harnesses are green ·
`qa` carries the new guards, each negative-tested · the runbook is written ·
and **the owner can change a price from a phone, see it validated before it
commits, and watch CI rebuild the site** — without opening a JSON file.

Option 0 stays available the whole time. Nothing about this removes it.
