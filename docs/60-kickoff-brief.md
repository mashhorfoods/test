# Kickoff brief — Phase 00, written last

Written 4 September 2026. The final phase in the WEBSTART table with no output
of its own, and the only remaining gap on the whole list that can be closed by
writing rather than by waiting for somebody.

---

## 1. Why this exists, and why it is honest that it exists last

WEBSTART puts Phase 00 first: brand to product, before anything is designed.
Here the product existed before the process did — that is what `docs/27` was an
audit *of* — so this document cannot pretend to have briefed the work. Its job
is narrower and more useful: **to write down the things that were assumed for
five months and never recorded**, and to be exact about which of them are still
assumptions.

A retroactive brief that reads as though it were written first would be a lie
the repository has no other examples of. This one is dated, and where it does
not know something it says so.

## 2. The business

| | |
| --- | --- |
| **Trading name** | Pixora |
| **What it sells** | Branding & design, websites, social media management, digital advertising, and the four together as one engagement |
| **Positioning** | A remote studio serving the Gulf and Egypt, priced as a new entrant in USD. Frozen at Gate 01, rationale in `docs/31` §5 |
| **The one claim** | Four services bought separately means four conversations, four briefs and four versions of the brand. One partner means one |
| **Conversion** | WhatsApp, with the package and price pre-written into the message. Secondary: an email form |
| **Languages** | English and Arabic, equally, with true RTL |
| **Legal entity** | **Unknown. See §3 — this is the open item, not a formality** |

## 3. The identity gap, which is the real finding of this document

Every published contact detail is **personal**:

| Channel | What it is |
| --- | --- |
| Email | `muhalabsalah@gmail.com` — a personal Gmail |
| Portfolio link | `muhalabsalah.github.io` — a personal GitHub Pages site |
| WhatsApp / phone | Personal numbers |
| Registrar, host, GitHub | Personal accounts (`docs/58` T1) |

Against that, the site **publishes a price list and asks for a 50% deposit.**

That combination is the gap. It is not a paperwork problem, and it shows up in
four places that are each already documented as open, none of which read as
connected until they are listed together:

1. **C-6** (`docs/28` §7) — no confirmed entity, agency email or address. Open
   since Phase 01.
2. **Organization JSON-LD** ships a name and a URL and nothing a registry could
   confirm, because there is nothing to put there.
3. **`docs/58` T4 — impersonation.** A cloned site with a changed WhatsApp
   number is hard to disprove when the original's own number is personal too.
4. **`docs/58` T5 — email spoofing.** SPF, DKIM and DMARC cannot be published
   for a domain that sends no mail. Quotes travel from a Gmail address that
   says nothing about `pixora`.

**The verification band is the current answer**, and it is a good one: a named
human, a face, and two profiles a stranger can check. `docs/30` PS-01 argued it
as a conversion feature and `docs/58` counts it as a security control. But it
is a mitigation for a missing entity, not a substitute for one.

**What closes it,** in the order that pays:

1. Domain email — `hello@` on the domain the site already runs on. Hours, not
   weeks, and it retires half of T5 immediately.
2. SPF, DKIM and DMARC published *at the same moment*, not later (`docs/58` §5).
3. A Google Business Profile and one directory listing — P1-1, and the two
   cheapest third-party confirmations that exist.
4. The legal entity, when there is a reason for one. **CR and Maroof only if
   the entity is Saudi**; the site currently claims neither, which is correct
   while neither is true.

## 4. Ownership and approval authority

**One person is the owner, the designer, the developer, the content author and
the approver.** That is the honest description, and it is what makes this
project fast.

It is also the standing risk in it, and no document has said so before: **all
three WEBSTART gates were held by the person who did the work.** `docs/37`,
`docs/41` and `docs/46` are real — each has measured criteria — but a gate that
cannot be failed by someone else is a checklist, not a gate.

That does not invalidate them. It does mean the three things this project has
consistently listed as outstanding are **exactly the three that require a
second person**, and they are still the highest-value work available:

| | Who | Still open |
| --- | --- | --- |
| Five moderated sessions with real buyers | Buyers | P1-12 |
| Native-speaker Arabic review for register and terminology | An Arabic speaker | P1-9 |
| A lawyer's read of the Terms, especially cancellation | A lawyer | P1-11 |

None of them is expensive. Each of them is the only way to find a class of
defect that this repository's four harnesses structurally cannot: a harness
can prove the Arabic *exists* and cannot tell you it reads like a translation.

## 5. Scope — what this engagement is

**In, and built:** a static bilingual marketing site — homepage, pricing, one
case study, about, privacy, terms, 404 — with published prices, a WhatsApp-first
conversion path, analytics, a generated hero film, and the build and quality
tooling that keeps them consistent.

**In, and deliberately not built** (Gate 01, `docs/37` §2):

- No CMS or admin dashboard. One maintainer edits data files (C-8; reopening
  triggers in `docs/36` §4 — **the owner is reconsidering, and nothing is being
  built while that is true**).
- No backend, database, accounts, uploads or payments. `docs/58` §3 is a list
  of attack surfaces that do not exist because of this line, and §7 says to
  rewrite the threat model the day it changes.
- No `/work` index, no per-service pages. Both need a second case study first.
- No blog, no client portal, no A/B infrastructure (`docs/27` P3).

**Out, and would be a new engagement:** anything with a server behind it.

## 6. Brand and licences

- **The wordmark is type, not artwork** — Poppins, set as a lockup in markup so
  it stays crisp at any density and can be restyled per breakpoint. There is no
  designed logo file; `logo.svg` is a derivation of the accent letterform for
  the browser tab, and `src/assets/brand/README.md` says exactly what to
  replace if a designed mark ever exists.
- **Fonts: Poppins and Cairo, both SIL Open Font License 1.1**, self-hosted,
  with the licence texts committed beside the files. Self-hosting is a privacy
  and performance decision (`docs/36`); the licence permits it.
- **Client material** — Al Mada's deliverables are published with permission
  (C-7). The images themselves are not in the repository, which `docs/57` §2
  records as the one irreplaceable asset that is backed up nowhere.
- **Everything else in this repository** is the studio's own.

## 7. What would make this document wrong

Each of these turns a line above into a lie, and each should be a reason to
edit it rather than to remember it:

- A legal entity is registered → §2 and §3, and the JSON-LD gains real fields.
- Domain email starts sending → §3 items 1 and 2 close together, or not at all.
- A second person joins → §4's gate argument changes, and it is the change most
  worth making.
- Anything gains a server → §5, and `docs/58` §7 fires.

Otherwise: twelve months.
