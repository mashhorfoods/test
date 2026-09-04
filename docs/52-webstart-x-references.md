# WEBSTART X · X02 — the reference set

Named 4 September 2026, from the owner's brief. **Not yet analysed** — see §4.

---

## 1. The brief, in the owner's words

> *"I like this website regarding Hero section and how they showing their
> options / services / products on different screen sizes. The padding between
> sections and how they added motion / shorts / slideshows and everything that
> can attract you to their website & keep you exploring their options."*
>
> — with `pixverse.ai` given as the example

That is five separate asks, and they are worth keeping separate because they
have different answers and different costs:

| | The ask | What it really means |
| --- | --- | --- |
| R1 | **Hero** | The first screen states the offer and shows the work, rather than describing it |
| R2 | **Options across screen sizes** | A grid of services that re-thinks itself per width, not one that shrinks |
| R3 | **Padding between sections** | Rhythm — the page breathes, and spacing signals where one idea ends |
| R4 | **Motion, shorts, slideshows** | Movement that shows the product working |
| R5 | **Keep exploring** | Each section ends by opening the next, so scrolling feels rewarded |

R5 is the real request. R1–R4 are how other sites achieve it.

## 2. The reference set

WEBSTART X asks for a **focused** set, not a gallery. Nine, each carrying one
job, across the four categories the framework names.

**User-selected — primary experience reference (X04)**

| Reference | Referenced for |
| --- | --- |
| **PixVerse** `pixverse.ai` | The whole brief. Primary reference: hero, option display, rhythm, motion |

**Aspirational leaders — world-class patterns**

| Reference | Referenced for |
| --- | --- |
| **Runway** `runwayml.com` | R1, R4 — a cinematic hero that is the product's own output, not a stock video |
| **Linear** `linear.app` | R3 — the clearest section rhythm on the web; restraint as a feature |
| **Apple** product pages | R5 — scroll-driven storytelling; the canonical "keeps you exploring" |
| **Stripe** `stripe.com` | R2 — how a company with many offerings lets a visitor find *their* one |
| **Vercel** `vercel.com` | R2, R3 — dark-surface card grids that re-flow rather than shrink |

**Direct and adjacent — the market standard, and outside it**

| Reference | Referenced for |
| --- | --- |
| **Awwwards agency winners** — aino.agency, KVS Studio, Boldium | The standard Pixora is judged against. Agency sites, like ours |
| **Framer** `framer.com` | R2, R4 — showing many options as a living, browsable set |
| **A Gulf or Egyptian agency site of the owner's choosing** | The market standard *in Arabic*. See §3 |

## 3. The gap nobody in the reference set fills: Arabic

Every site above is **left-to-right only**. Pixora is bilingual with true RTL,
and that is where "borrow as principle" gets tested rather than recited:

- A hero whose composition depends on a left-anchored headline and a
  right-anchored visual **mirrors** in Arabic. Mirrored is not automatically
  right — the eye enters from the other side, so the emphasis lands elsewhere.
- Scroll-driven motion that sweeps left-to-right reads as *backwards* in
  Arabic. Direction is meaning, not decoration.
- Latin display faces carry the rhythm on every reference site. Arabic
  typography has different vertical metrics; the same spacing scale does not
  produce the same texture.

**So the reference set needs one Arabic-first site the owner respects** — even
an imperfect one. Without it, X03 deconstructs nine LTR experiences and adapts
them to a site half of whose visitors read the other way. That is the specific
form "blind copying" would take on this project.

## 4. Why this set is *named* and not yet *analysed*

**This environment cannot open any of them.** The egress proxy refuses every
outbound page fetch — `pixverse.ai`, `awwwards.com` and `linear.app` were all
tried and all returned `EGRESS_BLOCKED`. Web *search* works and returns titles,
URLs and second-hand summaries; it does not return a page.

That matters more here than it did in Phase 02. Benchmarking a competitor's
*pricing* from search results is thin but workable. Benchmarking an
*experience* — rhythm, motion, how a grid re-thinks itself at 768px — from
someone else's blog post is not analysis. It is repeating an opinion.

**What closes it, cheaply:** for each reference, a screen recording scrolling
the full homepage at **desktop and phone width**, plus the hero as a still.
Two minutes per site. Then X03 runs on what the page actually does.

Start with PixVerse alone if that is easier — it is the primary reference, and
one properly deconstructed reference is worth more than nine described ones.

## 5. The trade to decide before any of this is built

The reference sites are heavy by design. Video heroes, WebGL, motion libraries.
This site is **one HTTP request, ~100ms to first paint, zero dependencies** —
and that was not an accident, it was Phase 21's whole argument.

A PixVerse-style hero costs megabytes. In the Gulf and Egypt, on a phone, on
mobile data, that is not a neutral trade — it is the buyer bouncing before the
hero finishes loading. The framework's own X04 says **REJECT: impressive-looking
patterns that do not serve our users or objectives**, and the guardrails require
performance to be *maintained or improved*.

So the question X05 has to answer, before a line is written:

> **How much weight is the hero worth, and what is the budget?**

Three honest positions, to be chosen deliberately rather than drifted into:

| Position | Cost | What it buys |
| --- | --- | --- |
| **Hold the line** — motion from CSS only, no video | ~0 KB | Keeps the fastest site in its market. Least like the reference |
| **One budgeted showpiece** — a single poster-framed, lazy-loaded video hero, phone gets a still | ~1–2 MB desktop, ~0 on phone | Most of the feeling, on the screen where bandwidth is cheap |
| **Full reference treatment** — video throughout, motion library | 5–10 MB+ | Looks like the reference. Ends the performance story |

**CHOSEN 4 September 2026.** The middle one — see `docs/53` for the budget and
the checks that now enforce it. It is also what I would have argued for, and it is the one the guardrails
support: the desktop visitor who is browsing gets the showpiece; the phone
visitor on mobile data gets a fast page and a still frame. It was the single
decision shaping everything downstream, and it is now made.

## 6. Status

Reference set named. **X02 is not complete** until the recordings arrive or the
owner replaces the list. X03 has not started.
