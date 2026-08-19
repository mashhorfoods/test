# Full Arabic

The site shipped bilingual *machinery* from Stage 00 — RTL layout, logical
properties, a language toggle, mirrored compositions — with English copy and a
`data-i18n-pending` marker on everything untranslated. This closes it: **every
string on the page now exists in both languages.**

Verified by `scratchpad/i18n.js` — 5 groups, both languages, with and without
JavaScript.

| | Before | After |
| --- | --- | --- |
| Elements awaiting translation | 148 | **0** |
| Bilingual elements in the document | 72 | **694** |
| Package features with Arabic | 38 of 109 | **87 of 109** |

---

## 1. How it works, and why not at runtime

Both languages ship in the markup and CSS hides the inactive one. That is the
pattern the supplied Arabic already used, and it is the only one that satisfies
two rules this site has held since Stage 00: **the page must work with
JavaScript disabled**, and **both languages must be readable by a crawler**. A
runtime string swap fails the first and hides the Arabic from the second.

- `src/data/i18n-ar.json` — 149 entries, keyed by the English text.
- `tools/build-i18n.js` — rewrites each marked element into the span pair.
  Anything without a translation **keeps its marker and is reported**; silence
  would let the page ship half-translated.
- Package data lives in `src/data/pricing.json` as before, now with `ar`,
  `levelAr` and `purposeAr`, rendered bilingual by `tools/build-pricing.js`.

A value may be an HTML fragment, because the headlines carry `<br>` and an
accent `<span>` and the Arabic has to carry the same structure or the two-tone
headline breaks in one language.

## 2. The register: what stays in English, and why

The supplied Services & Pricing document writes Arabic that **keeps English
product and technical terms inline** — `Content Calendar`, `Stories`,
`Hashtag Research`, `Landing Page إضافية`, `صفحة Website إضافية`,
`4 Reels شهريًا`. Thirteen of its own feature strings have an Arabic value
identical to the English one.

So this follows the client's own voice rather than translating everything on
principle. **60 English strings still show in the Arabic view, every one
deliberate**, and the test asserts the list rather than tolerating whatever
turns up:

- **Package names** — Starter, Professional, Advanced, Landing Page, Business
  Website, Social Growth, Ads Performance …
- **The source's own English terms** — Audience Targeting, Retargeting,
  Conversion Tracking, A/B Testing, Typography System, Company Profile …
- **Platform names** — Facebook Ads, Instagram Ads, TikTok Ads, Snapchat Ads,
  Google Ads, Meta + Google Ads.
- **Brand and data** — PIXORA, Digital Agency, the email address, the viewport
  figures 1440px / 768px / 375px.

Two terms were **reverted** to English after being translated: `Copywriting`
and `Graphic Design`. Both appear in the source's own Arabic in English, and a
term cannot read Arabic in a capability chip and English in a feature line on
the same page.

## 3. A cascade bug this exposed

The two rules that hide the inactive language lived in the **`base`** layer.
The hero constellation styles its own child spans — `.c-orbit__label span {
display: block }` — and `components` beats `base` on **layer order, whatever
the specificity**. Four labels rendered in both languages at once.

They now live in **`utilities`**, the last layer in the cascade contract.
Showing the wrong language is never what a component meant to do, so nothing
may override it. This is exactly the failure Stage 00's layer statement was
written to make impossible, in the one place the rule had been filed under the
wrong layer.

## 4. Two content bugs found on the way

- **`"Development, setup and the integrations the site or store requires."`** —
  a leftover from the E-Commerce removal, still naming a service the site no
  longer offers. It surfaced because the translation had no matching key.
- **`"1 add-ons"`** — the Branding add-on category announced itself
  ungrammatically to screen readers. Now `1 add-on`, with `إضافة واحدة` in
  Arabic, and the test knows the difference between singular and plural.

The Arabic count phrases are whole noun phrases, not a numeral glued to a
plural: Arabic counts 1, 2 and 3–10 differently, so `${n} باقات` is wrong for
one and for two.

## 5. What the suite checks

- **Complete** — nothing renders in the other language, in either direction;
  zero elements still awaiting translation.
- **Nothing slips through** — every English string visible in the Arabic view
  is on the deliberate list.
- **Layout survives** — no overflow and no clipped text at twelve widths in
  both languages. Arabic words are longer and its metrics differ; a layout
  measured in English is not a layout proven in Arabic.
- **Without JavaScript** — English renders, Arabic is hidden but **present in
  the document**, so a crawler still sees it.
- **The file itself** — no empty values, and every value that is not a
  deliberate carry-over actually contains Arabic script.

## 6. Open

- **A native speaker should read this.** The Arabic is translated from the
  English I wrote across Stages 00–17. It is accurate and it follows the
  client's register, but marketing copy deserves a native ear before launch —
  particularly the hero and the section headlines, where rhythm matters more
  than fidelity.
- **The page still defaults to English.** For a Saudi-market site, defaulting
  to Arabic may be the better choice; it is one line in `initLanguage`. Left as
  it was rather than changed silently.
- **`<meta name="description">` is English only** — a static page has one, and
  it cannot switch with the toggle. Serving an Arabic page variant is the fix,
  and that needs a domain and routing.
