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

## 4. The other path: editing anything else

You need the repository on a machine with Node 22:

```
npm install
node build.js        # regenerates dist/ — the thing that actually ships
npm run check        # validate.js, qa.js, a11y.js
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
| `validate.js` | Walks the buyer journeys. **0 findings or something is broken** |
| `qa.js` | 24 sections. **0 high and 0 medium is the standard** |
| `a11y.js` | axe-core. **0 violations is the standard** |

**One finding is expected and safe to ignore:**

> `LOW [css] 91 selector(s) style nothing any visitor can see`

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
