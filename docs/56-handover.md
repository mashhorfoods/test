# Owner handover — running this site without me

Written 4 September 2026. WEBSTART Phase 19, item P1-13.

This is the document that makes the project yours. It assumes you can open a
terminal and edit a text file, and nothing else. Everything below has been run
on this machine and works.

---

## 1. The one idea

**You never edit the website. You edit the source, and one command builds the
website.**

```
src/  and  index.html        ← what you edit
        ↓  npm run build
dist/  and  pixora-site.zip  ← what you upload. Never edit these.
```

If you edit `dist/` directly, the next build erases it. That is not a bug — it
is the reason a change to a price appears in twelve places at once instead of
you finding eleven of them.

## 2. The three commands

Run them from the project folder.

| Command | What it does |
| --- | --- |
| `npm run build` | Rebuilds everything and writes `pixora-site.zip` |
| `npm run check` | Runs the three quality harnesses. **Read the last line of each** |
| `npm run release` | Both of the above, in order. This is the one to use |

GitHub also runs all of this on every push (`.github/workflows/check.yml`).
It does **not** deploy — uploading stays yours (`docs/61` AD-07).

First time on a new machine: `npm install` once, to fetch the two tools the
checks need.

## 3. Uploading

1. `npm run release` — each of the three harnesses should end with zero.

   **Read those two lines rather than trusting that the command finished.** The
   harnesses stop the build only on a HIGH finding; a MEDIUM or LOW is printed
   and the command still exits cleanly, because not every finding should block
   a deploy at two in the morning. That decision is yours, but you have to see
   it to make it.

2. Upload `pixora-site.zip` to **public_html** in Hostinger's file manager.
3. **Extract** it there. The filenames survive; that is why it is a zip.
4. Open the site and click three things: a package button, the language
   toggle, and a page in the footer.

**If `.htaccess` does not appear after extracting**, turn on "show hidden
files" in the file manager and check it is there. It carries the compression,
the security headers, the clean URLs and the custom 404 — and without it the
site looks perfect and quietly loses all four.

## 4. Where each kind of content lives

This is the table to keep. Everything on the site comes from one of these.

| To change… | Edit | Notes |
| --- | --- | --- |
| A price, a package, a feature, delivery time | `src/data/pricing.json` | Feeds the homepage, the pricing page, and every WhatsApp message |
| The scope facts shared by all packages | `src/data/pricing.json` → `terms.shared` | Also quoted by the Terms page. Change both together |
| The Al Mada case study | `src/data/story.json` | Chapters, quotes, the close |
| Buttons, labels, the reply promise, menu names | `src/scripts/navigation-map.js` | The `STRINGS` block near the bottom |
| Homepage copy | `index.html` | Every string is a pair: `data-lang-copy="en"` and `="ar"`. **Change both** |
| About, Pricing, Privacy, Terms, Accessibility pages | `src/pages/*.html` | Same English/Arabic pair rule. **Adding a page:** drop the file in, add it to `site.config.json` `pages`, to `SHIP` in `tools/build-zip.js` and to the list in `build.js`; the sitemap, canonical, social tags, print styles, budgets and axe pick it up on their own |
| Phone, WhatsApp, email | `src/scripts/navigation-map.js` (`CHANNELS`) and `site.config.json` (`contact.whatsapp`) | Both, or the package buttons and the contact section disagree |
| The domain, analytics, HSTS | `site.config.json` | One field moves the whole site to a new domain |
| The hero film | `src/showpiece/scene.html`, then `npm run film` | Or `npm run film:clips -- clipA.mp4 clipB.mp4` for video |
| The link preview card | `src/showpiece/card.html`, then `npm run card` | What WhatsApp shows when someone shares the site |
| How the site prints | `src/styles/07-print.css` | Paper is a light theme: it swaps the colour tokens and hides what cannot be tapped |
| The logo | `src/assets/brand/logo.svg`, then `npm run icon` | Regenerates the iPhone home-screen icon from it. The browser tab follows the SVG on its own |

## 5. The five things you will actually do

### Change a price

**From a terminal:**

1. Open `src/data/pricing.json`, find the package, change `price`.
2. `npm run release`
3. Upload.

**From a browser or a phone — no terminal at all** (`docs/63`, Option 0):

1. Open `src/data/pricing.json` on GitHub, edit the number, commit.
2. Wait ~3 minutes. CI runs all three harnesses, then rebuilds and commits
   `dist/` for you. **If the run goes red, nothing was committed** — read the
   log rather than assuming it worked.
3. Download `pixora-site` from that run's Artifacts, and upload it.

Both routes end at the same manual upload, on purpose — `docs/61` AD-07.

The price changes on the homepage card, the pricing page, the WhatsApp message
that button sends, and the sitemap's date. You changed one number.

### Add a package

Copy an existing package block in `pricing.json` and edit it. Keep `id`
unique — it is what the analytics and the contact form use to know which
package someone tapped. Leave a field empty and nothing renders for it; the
build never invents a value.

### Write in Arabic

Every visible string exists twice. In `index.html` and `src/pages/`, they are
side by side:

```html
<span data-lang-copy="en">Websites</span><span data-lang-copy="ar" lang="ar">المواقع الإلكترونية</span>
```

**Change both, always.** `npm run check` counts them and fails if one language
has fewer strings than the other, but it cannot tell you that an Arabic
sentence is stale — only that it exists.

**One trap worth knowing:** `src/data/i18n-ar.json` only fills strings that are
still marked `data-i18n-pending`. Once a translation has been written into the
markup, editing the JSON does nothing. If Arabic and English disagree on the
live site, edit the markup, not the JSON.

### Move to a new domain

Change `url` in `site.config.json`, run `npm run release`, upload. That updates
the canonical tags, the sitemap, the link-preview card address and the
analytics domain. Nothing else in the project names a host.

Then: set `hsts` to `false` first, verify the new domain serves HTTPS, and only
then set it back to `true`. HSTS is cached by browsers for a year — switch it
on over a domain that cannot answer and visitors are locked out, not merely
inconvenienced.

### Publish a new case study

`story.json` holds one. A second needs a page of its own — that is real work
rather than a data edit, and it is the outstanding item most worth paying for:
it opens `/work` and turns the homepage's one proof sentence into a list.

The proof band under the services list is written directly in `index.html`
(search for `c-proof`) and names Al Mada. If a second story ever replaces it
there, change both language spans.

## 6. What the checks actually check

`npm run check` runs three harnesses. None of them is decoration.

**`validate.js`** walks what a buyer does: every link resolves, a package
button carries its package and price into WhatsApp, the choice survives a round
trip to the form, the language holds across pages, the site works with
JavaScript off, a keyboard reaches everything, and no page overflows at
360/768/1440.

**`qa.js`** audits the built files: prices match `pricing.json`, titles and
descriptions are the right length, the sitemap matches the pages, headings are
in order, images have alt text and dimensions, contrast passes, both languages
have the same number of strings, the phone requests no video, the link preview
card and the iPhone touch icon both exist and shipped, and **no page costs a
visitor more than 1MB** — measured by loading it and scrolling the whole way
down, which is the only way the lazy images get counted.

**`a11y.js`** runs axe-core — an accessibility engine nobody here wrote —
against every shipped page at two widths and in both languages, plus the mobile
drawer while it is open. It carries exactly one exception, the decorative
footer watermark, and it re-verifies on every run that the watermark is still
decorative before granting it.

**What none of them can do** is tell you the site makes sense read aloud. A
screen-reader pass is still outstanding, and a green `a11y` line is not it.

**A finding is not a suggestion.** Every one of them was written because
something real broke — eight package buttons that vanished on phones, a link
preview that would have shown a grey strip, a price that disagreed with its
own card.

## 7. Things that will bite

- **Do not edit `dist/`.** The next build overwrites it.
- **Do not hand-edit `src/data/lastmod.json`.** It is generated, and committed
  on purpose: it records when each page's content last actually changed, so the
  sitemap can tell search engines the truth instead of claiming everything
  changed every time you rebuild. Commit it alongside `dist/`.
- **`.htaccess` is a hidden file.** File managers lose it silently.
- **The hero film is desktop-only by design.** A phone gets the still image and
  requests no video at all. If you ever see a phone downloading `hero.mp4`,
  something has broken and `qa.js` will say so.
- **The link preview image must stay under 12KB** or the build stops inlining
  it and the phone gains a request. `npm run card` keeps it there.
- **The security policy regenerates itself** on every build, listing each
  inline script by fingerprint. Add a script and it is included automatically.
  Hand-edit `.htaccess` and the next build discards your change.
- **The site prints.** `/pricing` on paper or as a PDF is a real document —
  black on white, every package fully expanded, no buttons. If you ever change
  a colour token and the print goes strange, `npm run check` says so: `qa.js`
  measures the printed page against white paper.
- **Prices are in `pricing.json`, not in the page.** If you find a price in
  `index.html`, something is wrong — tell whoever is maintaining the code.

## 8. What no command can do for you

These need a person, and they are all still open:

| | Who |
| --- | --- |
| Create the four Plausible goals and custom properties | You |
| Add an uptime monitor — a Gate 03 criterion still unmet | You, 5 minutes |
| Verify Search Console and submit the sitemap | You |
| Al Mada's result sentence and the three facts in `docs/48` | Al Mada |
| A lawyer's read of the Terms page, especially cancellation | A lawyer |
| A screen-reader pass — `/accessibility` publicly says this has not been done | You, or a person who uses one |
| Five moderated sessions with real buyers | You, with buyers |

## 9. Where the reasoning is

Every decision on this site is written down, and the documents are worth more
than the code if you ever hand this to another studio.

| | |
| --- | --- |
| `docs/27` | The audit: what existed, what was missing, what got done |
| `docs/30` | Eleven problems, each with the evidence behind it |
| `docs/31` | Positioning, KPIs, and why the prices are what they are |
| `docs/44` | The release runbook and the four live checks |
| `docs/53` | The hero film budget, and what happens on a phone |
| `docs/55` | The quality baseline — what is good, what is not, measured |
| `docs/59` | Which browsers this works in, and what breaks below that |
| `docs/61` | Why the code is built the way it is, and what should make you change it |
| **`docs/62`** | **What is left. The working list — start here** |
| `docs/56` | This document |

If a future decision contradicts one of these, that is allowed. Contradicting
one **without knowing it exists** is what this file is trying to prevent.
