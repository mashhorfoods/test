# The admin dashboard — built

**7 September 2026.** `docs/120` is the plan. This is what happened when it was
followed, including the two places it was wrong and the four bugs the
acceptance tests found.

All nine phases pass. **`https://mashhorfoods.github.io/test/admin.html`**

> **AMENDED 7 September, later the same day — `docs/123` §2.** An independent
> pass found four defects in what is described below, and one of them made
> this page unusable for its only job: **it could not be typed into.**
> `rerender()` ran on every input event and begins with `replaceChildren()`,
> so the field being typed into was destroyed a character in. Typing `1234`
> into a price left `1`.
>
> Every acceptance test in §5 passed because every one of them used
> Playwright's `fill()`, which sets a value and fires a single event. §5b of
> this document says emulation is not a phone. The same sentence one level
> down: **a synthetic event is not a person.**
>
> Also fixed there: it committed to a branch nothing deploys from, a second
> operator's save could be overwritten without a word, and the sticky bar was
> still covering the message — the exact defect §5b is about. This document
> stands as written; `docs/123` is what happened next.

---

## 1. What it is, in one paragraph

A static page that edits `src/data/pricing.json` and `src/data/i18n-ar.json`
and commits them to the repository through the GitHub API, authorised by a
fine-grained token the operator pastes. There is **no server** — AD-01
survives. CI does everything downstream, exactly as it already does when the
same file is edited in GitHub's web editor.

**Its one reason to exist** is `docs/63`'s own objection to Option 0: *"a
missing comma is a broken build — caught by CI, but caught after you press
commit."* The Save button is disabled while anything is invalid, and the
reasons are listed above it by name.

---

## 2. The plan was wrong twice, and the code said so both times

### 2.1 The deployment answer was better than the one planned

`docs/120` §4.1 proposed a `<Files "admin.html">` block in `.htaccess`, giving
the page a scoped CSP so it could reach `api.github.com` without loosening the
policy for the whole site.

Reading `tools/build-zip.js` produced a better answer. **`SHIP` is an explicit
allow-list of what the upload archive contains, and `styleguide.html` is
already deliberately absent from it.** So the dashboard takes the same road one
step further: it is **not built at all**, lives at the repository root, and is
served by the review surface — GitHub Pages — which has no `.htaccess` and
therefore no policy to fight.

The live site's CSP is untouched. `api.github.com` is permitted nowhere on that
host, because the page that needs it is not on that host.

### 2.2 `challenge.json` came out of scope during P1

Both remaining files round-trip through `JSON.parse` →
`JSON.stringify(…, null, 2)` **byte-identically**, so a dashboard write changes
only what the operator changed. `challenge.json` does not: it carries blank
lines a person placed for readability, and re-serialising drops them. Every
commit would then carry cosmetic noise nobody made.

Recorded in the plan rather than quietly dropped.

---

## 3. Two validation rules were wrong, and the real data proved it

P1's test says the shipped data must pass every rule, on the reasoning that
**a validator that fails real data is a validator nobody will trust.** It
earned that line immediately.

| Rule as written | What the data said | The rule now |
| --- | --- | --- |
| `level` and `purpose` are required | **13 failures.** The Social category ships without either, and the generator omits the element rather than rendering an empty one — the page is correct | **Pairing, not presence.** A level in English with no Arabic is a defect; neither is a design choice |
| every Arabic field must contain Arabic | **1 failure.** `Facebook + Instagram` is the same in both languages on purpose | No Arabic is fine **only when the two sides are identical** — the signature of a proper noun |

Both are looser than what was written and **stricter than nothing**, which is
the useful place for a rule to be.

---

## 4. Four bugs the acceptance tests found

### 4.1 The confirmation was created and destroyed in one frame

`showResult()` prepended a box to `#app`. The very next thing to run was
`rerender()`, which begins with `replaceChildren()`. **The commit worked and
the page never said so.**

Found by the browser test asking for text it had been told would be there. The
result lives in state now and is drawn by `rerender()` — and any subsequent
edit clears it, because a "Saved" box above a form that has since changed is a
lie by staleness.

### 4.2 A negative test that crashed before the check ran

Adding `admin.html` to `SHIP` produced **no qa output at all** — not a pass,
not a failure. The zip builder had crashed trying to read a file that was on
its list and not in `dist/`.

That crash is a legitimate louder guard, but it meant the check I was testing
**never spoke**, and a silent run is not a pass. Re-tested in the state the
guard is actually for — in `SHIP` *and* present in `dist/` — where it fires.

Third time this session a negative test has been the thing that was broken.

### 4.3 A favicon 404

Minor, and fixed properly rather than filtered out of the test: the page links
the site's own mark, so the tab is identifiable and the console is clean.

### 4.4 Base64 and Arabic

`atob` alone mangles UTF-8. The content is more than half Arabic, so
`TextDecoder`/`TextEncoder` are on both sides of every read and write. Proved
by P6: the PUT body is decoded, parsed, and checked to carry the edited value —
and to end in the newline the round-trip test guarantees.

---

## 5. The phases, and how each was proved

| | Phase | Proof |
| --- | --- | --- |
| **P1** | Schema and one validator | `tools/admin-test.mjs` — round-trip byte-identical, shipped data clean, **22 negative tests** |
| **P2** | The shell | Renders with no token, asks for one, explains itself |
| **P3** | The credential | Bad token refused with a message that says what to do; good token names the account; **repository access verified separately from the account** |
| **P4** | Read | 12 packages, 60 fields, populated from the API |
| **P5** | Validate before commit | An invalid price disables Save and names the problem; fixing it re-enables |
| **P6** | Write | PUT carries the edited value, the file's `sha`, and the exact serialisation |
| **P7** | What happens next | The commit link and a plain-words account of the rebuild |
| **P8** | The guards | `qa.js` §33, five checks, **each negative-tested** |
| **P9** | Documentation | `docs/89` §3b, and `docs/63`, `docs/85`, `docs/58` amended |

`npm run admin:test` · `npm run admin:ui`

---

## 5b. The phone pass — what emulation found, and what it cannot

**Asked for on 7 September: test it on a real phone.** That cannot be done
here, and the limit is worth stating precisely rather than working around:
**this container has only Chromium.** iOS Safari — the engine that matters
most in this market — cannot be run at all, which `docs/59` already records as
a standing constraint. What follows is emulation at four device profiles, and
emulation is not a phone.

### What the numbers said, and what they missed

Four profiles (iPhone SE 375, iPhone 15 Pro 393, Galaxy S23 360, and 320) all
came back mechanically clean: **inputs at 16px** so iOS does not zoom on focus,
**every target ≥44px**, **zero horizontal overflow** at any width.

And the page was **unusable**. To change one price:

```
iPhone SE   7,024px   10.5 screens   Save button 10.4 screens down
320px       7,072px   11.1 screens
```

Twelve cards and sixty-one inputs rendered at once, with the Save button
beneath all of them. Fine on a desktop; on the device this was built to be
used from, changing one price meant scrolling past every other price to commit
it.

### Three fixes, and the third only a screenshot could find

**1. Categories collapse.** Native `<details>`, the same mechanism the site's
FAQ uses — works with no JavaScript, is a real disclosure to a screen reader,
and the browser handles the keyboard. All four start closed. **10.5 screens →
0.7.**

**2. The action bar is sticky.** "Can I save this yet" is now answerable
without scrolling to find out.

**3. The bar was covering the field it was describing.** This is the one the
measurements could not see, and it is why the screenshots were taken.

The bar carried the validity state as a bulleted list. Pinned to the bottom of
an iPhone SE, a three-line message made it tall enough that **the instruction
to fix the price sat on top of the price.** The Starter card was sliced
mid-word behind it. Every number said the page was healthy — 1.4 screens, no
overflow, no small targets.

So the message moved **to its field**, under the input it describes, and the
bar shrank to one line: *"1 thing to fix before this can be saved — see the
fields marked in red."* The bar is now **180px of a 900px screen, 20%**, and
that ratio is asserted in the test.

Two smaller things went with it: the header's explanatory paragraph hides once
you are signed in — it is orientation for a first visit, not 150px of every
subsequent one — and **an idle bar renders nothing at all**, because a bar
saying "No changes yet" over a disabled button is 30% of a phone screen spent
on nothing.

### The category holding a problem opens itself

Collapsing by default creates a way to hide a defect behind a summary. A
category with an invalid value opens on render and its summary says *"needs
attention"*, so nothing the bar mentions is ever out of sight. Asserted.

### What still needs a real device

Emulation cannot answer these, and `docs/117` §2 asks a person some of them:

| | |
| --- | --- |
| **iOS Safari at all** | No WebKit here. `position: sticky` bottom, `<details>` styling and `:has()` are all in the support floor, but "in the floor" is not "seen working" |
| The software keyboard | Whether it covers the field being typed into, and whether the sticky bar rides above or below it |
| Password managers | Whether one offers to fill the token field, and whether that is wanted |
| Paste | Whether a 90-character token pastes cleanly from the GitHub app |
| Real network | Every measurement here is against localhost |

**The five-minute script for an actual phone** is in `docs/89` §3b.

---

## 6. What it deliberately cannot do

- **Edit anything but those two files.** Not the markup, not the styles, not
  `site.config.json`, not the story. The failure it exists to prevent returns
  the moment it becomes a general-purpose file editor.
- **Touch enquiries, leads or personal data.** `docs/85` decided that and this
  does not reopen it.
- **Deploy.** It commits. CI builds and checks. **Uploading to the live host is
  still a person's deliberate act**, which is AD-07 and has not moved.
- **Reach the live site at all.** It is not on that host.

---

## 7. The honest cost

`docs/58` T9 is the new threat entry and it is not a footnote. A credential now
exists in a browser that did not before.

It is bounded — one repository, contents only, an expiry, `sessionStorage` by
default, revocable in one click — and it cannot survive a compromised operator
machine, on which their GitHub session is already readable. **T9 does not
create that exposure and does not remove it.**

The five guards in `qa.js` §33 exist because the arrangement that keeps this
safe is *invisible*: nothing about a file sitting in the repository root says
"this must never be uploaded", and the only thing between it and the live
server is its absence from a list in another file.

---

## 8. Option 0 is not removed

GitHub's web editor still works and the runbook still documents it. If the
dashboard is unreachable or behaving oddly, that road is unchanged.

**A tool that replaces a working path with itself and then fails has taken
something away.** This one is additive.
