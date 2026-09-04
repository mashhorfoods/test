# Stage 39 — The P1 build, and the content it waits on

Gate 01 is held and the master prompt is written, so the build resumes in
wireframe order. This records what shipped, and — precisely — what the rest
needs from the owner.

---

## 1. Shipped: scope facts on the package cards (W1, PS-05)

The price was published and never explained. At the new band, a buyer asks what
it buys and the page had no answer.

Each card can now carry three always-visible facts — **Delivery · Revisions ·
You own** — under a hairline beneath the features, and a single
**"What's not included"** disclosure holding the exclusions, what *"from"*
depends on, and payment terms.

**It renders only from values that exist.** Every field is empty today, and the
markup output is byte-identical to before: no label with a blank beside it, no
placeholder, no guess. Fill a field in and it appears; leave it empty and it
does not exist.

Built as a `<details>` rather than the site's accordion, deliberately: no
JavaScript, no ARIA of our own, no id wiring, and it survives a page whose
scripts failed to load. Its summary keeps the 44px target floor and it draws its
own marker, so the chevron points the right way in Arabic too.

### What to fill in — `src/data/pricing.json`

Two places, both scaffolded with empty strings and a comment explaining them:

**`terms.shared`** — applies to every package:

| Field | What to write | Example shape |
| --- | --- | --- |
| `ownership` | What the client ends up owning | *"Source files, yours to keep"* |
| `payment` | How payment works | *"50% to start, 50% at handover"* |
| `fromDepends` | What moves a "from" price | *"Number of concepts and applications"* |
| `excludes` | A list of things a package does **not** include | *"Printing"*, *"Ad spend"*, *"Photography"* |

**`facts` on each of the twelve packages** — `delivery` and `revisions`.

Both languages, plain words, no legal register: *"Two rounds of changes"* beats
*"the client is entitled to two (2) revision cycles"*. Then `node build.js`.

---

## 2. Not built, and why

Each of the remaining P1 items is blocked on content that only the owner has.
Building them empty would be the failure Phase 07 rejected — a component whose
existence invites filling it dishonestly.

| Wireframe | Waiting on |
| --- | --- |
| **W2 verification band** | The name and role to show, a response window you can actually keep (with working hours), and which links to offer as "check us" — Behance and LinkedIn already exist in the footer; a Google Business Profile and a directory listing do not yet |
| **W5 About** | The four sections in `docs/33` §W5: who you work with, how remote actually works, what we charge and why, and what we will not do |
| **W6 `/pricing` guide** | The five price drivers (scale, content readiness, languages, integrations, turnaround) in your words, and the "How we bill" facts — which are the same ones as §1 |
| **`/story` as a real case study** | The ten answers in `docs/35-case-studies.md` §4 |
| **`/work`** | Two case studies. One project is a story, not a portfolio |
| **Homepage proof strip** | Ships with the first case study |

Notice that §1's answers unlock two of these at once: the scope facts are also
the "How we bill" content the pricing guide needs.

---

## 3. Still blocked by this environment

| Item | Needs |
| --- | --- |
| P0-2 — self-host twelve images | The files. This session cannot reach that host |
| P0-3 — verify the live site, then enable HSTS | A network that can reach the domain |
| CSP | Written after the images are settled, so it names the final origin set |

---

## 4. Order when the content arrives

1. Scope facts → cards and the pricing guide gain their answer together.
2. Verification band → the trust gap closes on every page at once.
3. About → Flow B stops dead-ending.
4. `/pricing` guide → the search entry point opens.
5. First case study → `/story` becomes real, the homepage gains its proof strip.

Each is a small build against a wireframe that already exists, which is what
Gate 01 bought.
