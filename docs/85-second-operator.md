# A second person on the site — what that actually requires

**6 September 2026.** The owner reopened the admin dashboard question and
decided: a second person will run the page, with full access. `docs/69` §5 had
priced three options and named this exact trigger — *"a second content editor is
the one that matters"*. It has fired.

The answer to the scoping question was **content plus full repository access**,
and on data: **content only**, *and* **enquiries / leads**.

Those last two pull against each other, and resolving that is most of this
document.

---

## 1. The good news: there is nothing to build

Full repository access means the second person edits the same way the owner
does — GitHub's web editor, or a clone. **No CMS, no dashboard, no server, no
new authentication of our own.** `docs/69` §5's Option 1 and Option 2 both stay
unbuilt, and AD-01 survives intact.

The substrate is already right for it:

| | |
| --- | --- |
| Content lives in data files | `pricing.json` (31KB), `story.json` (16KB), `i18n-ar.json` (14KB) |
| CI runs on every push | `build.js`, `validate.js`, `qa.js`, `a11y.js` |
| CI rebuilds `dist/` for data-only edits | so a content editor never has to run a build |
| CI asserts the committed `dist/` matches a fresh build | so a stale or hand-edited `dist/` cannot ship |

That last row is the important one. Someone can change a price in
`pricing.json` through the browser, commit, and CI regenerates every page —
without ever installing Node.

---

## 2. The bad news, verified rather than assumed

Full access means the guardrails stop being advice and start being the only
thing standing between a mistake and the live site. So I checked what
guardrails exist.

**There are none.** From the GitHub API, this repository has exactly two
branches:

```
claude/master-design-system-setup-5oy6mo   protected: false
claude/webstart-project-audit-l7est2       protected: false
```

Two facts follow, and both matter more once a second person holds the keys:

1. **No branch is protected.** Anyone with write access can push anything
   anywhere, and CI cannot stop them — a workflow that runs after the fact
   reports a failure, it does not prevent one. **A check is only a mechanism
   when it is required.**
2. **There is no `main`.** Both branches are working branches. There is no
   single branch that means *this is the site*, which is the thing a second
   person most needs to be told and the thing branch protection would attach
   to.

This is the same pattern as `CONTACT_CHANNELS` in `docs/82` and Rule 13 in
`docs/83`: the safety was real in practice, and had no mechanism under it.
It held because one careful person was doing all the pushing. That premise is
what is being changed.

### 2.1 What to turn on, before the invitation goes out

Owner actions, in this order — none of them are mine to take:

1. **Establish a default branch** that means *live*. Everything merges into it;
   nothing is developed on it.
2. **Protect it**: require a pull request, and require the `check` workflow to
   pass before merging. That single setting turns the existing CI from a report
   into a gate, and it is the highest-value five minutes in this document.
3. **Then** invite the second person as a collaborator.

Doing (3) before (1) and (2) is the ordinary way this goes wrong.

---

## 3. Enquiries and leads — the answer is not to build one

Both *"content only"* and *"enquiries / leads"* were selected. Read literally
they conflict, and the conflict is worth being precise about, because one of
them is much more expensive than it looks.

**Today the site stores nothing.** Every route to a binding conversation runs
through WhatsApp or the visitor's own mail client — `docs/78` established this
for the legal brief, and it is why the site has no database, no backups of
personal data, and nothing to breach.

A leads view inside a dashboard would be **the first personal data this site
ever holds.** That is not a feature, it is a category change:

- somewhere to store it, which means a server or a third party;
- a retention period, and a way to delete on request;
- the privacy policy rewritten — and `docs/65` / B4 are still with a lawyer;
- a backup plan for data whose loss is now somebody else's problem too.

**It also is not necessary, because the enquiries already exist.** Every one of
them arrives in one of two inboxes:

| Channel | Where the record already lives |
| --- | --- |
| WhatsApp — the primary CTA, and now pre-filled (`docs/82`) | The WhatsApp thread |
| Email | The mail account |

**Recommendation: share the accounts, not a database.** A WhatsApp Business
account supports multiple devices and operators, and the mail account can be
delegated. The second person sees every enquiry, in the place it actually
happened, with full history — and the site stays stateless.

If a real CRM is wanted later, that is a deliberate Option 2 conversation with
the privacy work attached, not a checkbox on this one.

---

## 4. What the second person needs written down

`docs/56-handover.md` is written for the owner — someone who already knows why
the site is the way it is. A second operator needs the shorter, blunter
version, and it does not exist yet:

- **The one rule:** every visible string exists twice, English and Arabic.
  Change one and you have published a page that disagrees with itself.
  `build-i18n.js` reports what it can, but only for `index.html` (`docs/81`
  §6.2).
- **Prices live in `pricing.json`** and nowhere else. Editing a number in a
  built page is undone by the next build.
- **Never hand-edit `dist/`.** CI asserts it matches a fresh build and will
  fail the push.
- **What the harnesses mean** when they fail, and which failures are safe to
  ignore (the one standing LOW on dead CSS — `docs/75` §4).
- **What not to touch** without saying so first: `site.config.json`, anything
  in `tools/`, the CI workflow.

That runbook is the deliverable that makes full access safe, and it is now on
the plan.

---

## 5. Decision recorded

| | |
| --- | --- |
| **Option chosen** | Option 0 extended — full repository access, no new software |
| **AD-01** | **Survives.** No server, no auth of ours, no stored personal data |
| **Blocking prerequisite** | A default branch, protected, with `check` required — before the invitation |
| **Leads** | **Not built.** Shared WhatsApp Business and mail accounts instead |
| **New work** | An operator runbook (§4) |

The cheapest correct answer, arrived at by asking what the second person needs
to *do* rather than what a dashboard would look like.
