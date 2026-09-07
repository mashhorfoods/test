# Running the site — the short version

For the second person. `docs/56` is the full handover and assumes you know why
the site is the way it is. **This assumes you do not, and only covers what you
will actually do.**

---

## 1. The one rule

**Every visible string exists twice — English and Arabic.**

```html
<span data-lang-copy="en">Three packages</span><span data-lang-copy="ar" lang="ar">ثلاث باقات</span>
```

Change one and leave the other and you have published a page that disagrees
with itself, in a way that looks fine to you and wrong to half the visitors.
`build-i18n.js` reports missing Arabic — **but only for `index.html`**, so on
every other page this is on you.

**If you cannot write the Arabic, do not publish the English.** Leave it, and
ask.

---

## 2. What you can change, and where

| To change | Edit | Then |
| --- | --- | --- |
| **Prices, package names, features, what's excluded** | `src/data/pricing.json` | Nothing — CI rebuilds it |
| **The Al Mada case study** | `src/data/story.json` | Nothing — CI rebuilds it |
| **Arabic for homepage strings** | `src/data/i18n-ar.json` | Nothing — CI rebuilds it |
| Homepage words | `index.html` | Needs a build (§4) |
| About / Pricing / Privacy / Terms / Accessibility words | `src/pages/*.html` | Needs a build (§4) |
| Phone, WhatsApp, email | `src/scripts/navigation-map.js` **and** `site.config.json` | Needs a build. Change both or the page and the button disagree |

**A price lives in `pricing.json` and nowhere else.** Editing a number you can
see in a built page is undone by the next build — the page is generated from
the data, not the other way round.

---

## 3. The easy path: editing data in the browser

`src/data/*.json` is the only content you can change safely without seeing the
site build, and CI knows it. Open the file on GitHub, edit, commit.

**CI rebuilds `dist/` and commits it for you** — but only when the push
contains *nothing but* data files, docs, or generated output. Add one line to a
stylesheet in the same push and the allowance is gone, the strict check runs,
and it fails because `dist/` is stale.

**So: keep data edits in their own commit.** One thing at a time.

Watch the run under **Actions**. Green means it is live-ready. Red means read
the log — it names the file and the reason.

---

## 3b. The dashboard — prices and Arabic strings, from a phone

**Added 7 September 2026.** `docs/120` is the plan, `docs/121` the build.

**`https://mashhorfoods.github.io/test/admin.html`**

It edits two files — prices and packages, and the Arabic string map — and
**nothing else**. It checks everything before it will let you save, which is
the one thing editing JSON in GitHub cannot do: there, a wrong price is a red
build ten minutes later.

### First time: make a token

1. `github.com/settings/personal-access-tokens` → **Generate new token**.
2. **Repository access → Only select repositories → `mashhorfoods/test`.**
3. **Permissions → Repository permissions → Contents → Read and write.**
   Nothing else. Do not grant anything else.
4. **Expiration:** set one. 90 days is sensible.
5. Copy it. It is shown once.

Paste it into the dashboard. Tick *"remember on this device"* only on a device
that is yours and locked — without it, the token is forgotten when you close
the tab, which is the right default on a shared or borrowed machine.

**Forget token** clears it from both places. Lost the device? Revoke the token
at the same settings page — one click, and it is dead everywhere.

### Changing a price

1. **Prices and packages** → find the package → change the number.
2. Digits only. **No `$`, no comma, no space.** The site adds "From" and
   "USD" itself.
3. Watch the **Save** button. If it is grey, something is wrong and the reason
   is listed above it by name. Fix that first — **the button will not let you
   commit something the build would reject.**
4. Write a few words saying what changed, and Save.
5. It commits to **`main`** — the branch the site is built from — then the
   build runs: it rebuilds the site, runs the five checks, and commits the
   result back. **About four minutes.**

   > **Corrected 7 September.** This used to say "the working branch", and so
   > did the code: the branch was a constant, set before `main` existed. A
   > save would have produced a green commit on a branch nothing deploys
   > from — the site simply would not have changed, with nothing anywhere
   > saying why. The dashboard now asks GitHub which branch is the default
   > and writes to that, so it cannot go stale again.

### If it says the file changed on the repository

Someone else — the other operator, or a commit of yours from another device —
saved the same file after you opened it. **Nothing has been lost and nothing
has been overwritten.** Your edits are still on the screen.

Copy anything you need, reload the page, and make the change again on the
current version. The dashboard refuses rather than guessing, because guessing
would erase whatever the other person wrote.

### What it will not let you do

A price with a currency symbol · a package with no name · two packages with
the same name · a level or purpose in one language and not the other · a
feature with no Arabic · a missing delivery or revisions promise · Eastern
numerals (٠-٩) where the site uses 0-9 everywhere.

Each of those is a real rule the build enforces. The dashboard just tells you
first.

### Five minutes on your own phone — please actually do this

Everything above was tested by **emulating** four phones. **No real device has
opened this page**, and this container cannot run iOS Safari at all — which is
the browser most of this market uses (`docs/59`). Emulation gets layout right
and gets the things below wrong.

Open `https://mashhorfoods.github.io/test/admin.html` on your phone and check
six things. **A one-line answer to each is enough**, and "it was fine" is a
useful answer.

| | What to try | What would be wrong |
| --- | --- | --- |
| 1 | **Paste your token** into the field | It does not paste cleanly, or the keyboard covers the field, or a password manager interferes |
| 2 | Tap **Prices and packages**, then open a category | The disclosure does not open, or the caret does not turn |
| 3 | Tap a **price field** and type | The page zooms in (it should not), or the keyboard covers what you are typing |
| 4 | Type `$490` — deliberately wrong | The red message under the field is hidden behind the bar at the bottom, or you cannot see the field and the message at once |
| 5 | Fix it, then look at the **Save** button | It is off-screen, or you cannot tell whether it is enabled |
| 6 | Turn the phone **sideways** | Anything overlaps, or the bar covers half the screen |

**Item 4 is the one to watch.** An earlier version had the message covering the
field it was about — the instruction to fix the price sat on top of the price.
It was fixed, and it was found by looking at a screenshot rather than by any
measurement, which is exactly why a real device pass is worth five minutes.

### If something looks wrong

**The dashboard cannot break the site.** Worst case it commits something the
harnesses refuse, CI goes red, and the live site keeps serving what it already
had — nothing is deployed automatically. Tell whoever maintains the code, or
revert the commit in GitHub.

**GitHub's web editor still works** and is not going away. If the dashboard is
down, unreachable or behaving oddly, edit `src/data/pricing.json` there exactly
as before. §4 below is that road.

---

## 4. The other path: editing anything else

You need the repository on a machine with Node 22:

```
npm install
node build.js        # regenerates dist/ — the thing that actually ships
npm run check        # validate.js, qa.js, responsive.js, arabic.js, a11y.js
```

**Commit `dist/` along with your change.** CI checks that the committed `dist/`
matches a fresh build, and rejects the push if it does not. That check exists
because `dist/` is what gets uploaded: if source and output disagree, the old
output is what visitors get, silently.

---

## 5. Three things that will bite you

**Never hand-edit anything in `dist/`.** It is generated. Your change survives
until the next build and no longer, and CI will reject the push.

**Never add a page by copying an HTML file alone.** A new page has to be
registered in `site.config.json`, in `build.js`, and in `tools/build-zip.js`,
or it will not ship, will not appear in the sitemap, and will not be checked.

**Never change a published contact detail in one place.** The phone number,
WhatsApp number and email appear in the markup of several pages and in
`site.config.json`. `qa.js` §19 fails the build if they disagree — which is the
system working, not the system being difficult.

---

## 6. Reading the harness output

```
npm run check
```

| | |
| --- | --- |
| `validate.js` | Walks the buyer journeys at 1280 and 390. **0 findings or something is broken** |
| `qa.js` | 30 sections over the built files. **0 high and 0 medium is the standard** |
| `responsive.js` | 320/768/1024 × 8 pages × English and Arabic — 48 combinations. **0 high is the standard** |
| `arabic.js` | The bilingual layer: pairing, `lang="ar"`, untagged Arabic inside English, figures that disagree between the languages, the WhatsApp messages. **Static, no browser, fast.** 0 high is the standard — and it cannot tell you whether the Arabic is *good*, which is what `docs/91` asks a person |
| `a11y.js` | axe-core. **0 violations is the standard** |

Which widths each one actually renders is tabled in `docs/69` §5d. That table
exists because `responsive.js` was added on 7 September after `docs/115` found
nine pricing cards cut off at 320px — a width nothing had ever rendered.

**One finding is expected and safe to ignore:**

> `LOW [css] 103 selector(s) style nothing any visitor can see`

That is a documented, deliberate decision (`docs/75` §4) — a utility layer and
a type scale kept whole on purpose. It has printed 91 for weeks. **If the
number changes, something changed; investigate rather than assume.**

Everything else: fix it or ask. A HIGH is never shipped.

---

## 7. What not to touch without saying so first

- `site.config.json` — one field moves the whole site to a new domain
- anything in `tools/` — these generate the pages
- `.github/workflows/check.yml` — the only thing standing between a mistake and
  the live site
- `build.js`
- the four `.html` files at the repository root — they are **generated**; edit
  `src/pages/` instead

---

## 8. Publishing

`dist/` is the site. `tools/build-zip.js` packages it; upload the contents to
`public_html` and extract.

**The whole of `dist/assets/` uploads**, so anything sitting in it reaches the
server whether a page asks for it or not. `qa.js` §24 fails on files nothing
references, which is how that stays true.

---

## 9. When something looks wrong on the live site

In order:

1. **Is `dist/` current?** `node build.js`, then check whether anything changed.
   If it did, the last push shipped a stale build.
2. **Run `npm run check`.** Most defects on this site were found by a harness
   before a person saw them.
3. **Look at it on a phone**, in both languages. More than half the defects
   this project has fixed were only visible at one width or in one language.

That third one is not a formality. Text shrinking as the screen grew, buttons
252px apart, four service names at 10px, a hero CTA reachable for 6% of a
scroll — every one of those was found by looking, not by testing.
