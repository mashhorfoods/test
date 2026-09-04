# Stage 35 — Anonymised client work: rules, format, and what is needed

**C-7 answered, 4 September 2026: client work may be published anonymised.**

That is the single largest unblocking in this project. The trust gap was the
biggest conversion problem the audit found (`docs/30-problem-solution.md`
PS-01), and the reason it had stayed open was permission. It is now open only
for want of facts.

This document sets the rules, defines the format, and lists exactly what is
needed to publish the first one. **Nothing is built until a real project's facts
exist** — an empty portfolio is the failure mode Phase 07 explicitly rejected.

---

## 1. What "anonymised" means here

The project's content rule has not changed: nothing is invented. Anonymisation
removes the client's identity; it does not license approximation.

**Allowed — and enough to be persuasive:**

- The sector and the market: *"a retail brand in Riyadh"*, *"a clinic in
  Cairo"*, *"an F&B startup in the Gulf"*.
- Size in ordinary words: *"a two-person business"*, *"a growing team"*.
- What they came with, in their situation's terms: *"a logo made in Word and no
  website"*.
- What was delivered, exactly — the package or packages, and what was in them.
- How long it took, in real elapsed time.
- The work itself, shown: logo, palette, layout, posts, ad creative.
- An outcome **we can stand behind**, in the client's own framing where we have
  it in writing.

**Not allowed:**

- Any invented number. No "traffic up 300%", no "sales doubled", unless the
  client gave us that figure and we can point at where it came from.
- Detail that identifies by elimination — an unusual niche, a distinctive
  product, a dated launch, a city where the sector has one player.
- Client artwork we do not have the right to show, anonymised or not.
- A testimonial nobody actually said, even paraphrased.

**A useful test:** could the client read the page and recognise themselves
without being recognised by a stranger? That is the line.

---

## 2. Where it goes

Two surfaces, already designed:

| Surface | What it carries | State |
| --- | --- | --- |
| **`/story`** | One project told properly — five chapters, the scroll narrative that exists today | Built. The chapters are data (`src/data/story.json`); replacing them replaces the story, and the page, sketches, thread and motion do not change |
| **`/work`** | An index of two or more, each linking to its own story | Deferred in `docs/32-content-ia.md` §2 **behind the trigger "C-7 permits client work"**. The trigger has now fired — it enters scope when there are at least **two** case studies. One project is a story, not a portfolio |
| **Homepage proof strip** | Three lines of evidence near the services: sector, what was delivered, elapsed time | New, small, and worth building with the first case study rather than after the third |

---

## 3. The format — what `story.json` needs per project

The page reads five chapters. Each takes a title, a lead, an aside and a
sketch; the sketches (`scatter → probe → sequence → spine → resolve`) are
presentation and do not change.

| Chapter | The question it answers | Sketch |
| --- | --- | --- |
| 01 Challenge | What was wrong when they came to us? | `scatter` |
| 02 Insight | What did we notice that they had not? | `probe` |
| 03 Idea | What did we propose, in one sentence? | `sequence` |
| 04 Transformation | What did we actually make? | `spine` |
| 05 Impact | What is different now — in their words or in plain fact? | `resolve` |

Every line ships in **both languages**, as everything on this site does.

---

## 4. What is needed from the owner — one project at a time

Answer these for the project you would most like a stranger to see. Prose is
fine; I will write the chapters, in both languages, and nothing will appear that
is not in your answers.

1. **Sector and market.** *("A dental clinic in Jeddah.")*
2. **What state were they in when they came to you?** What did they have, what
   was missing, what was costing them?
3. **What did you notice that they had not?** The thing that changed how the job
   was approached.
4. **What did you propose?** One sentence, as you would have said it to them.
5. **What did you deliver?** Which package or packages, and what was actually in
   them.
6. **How long did it take**, start to handover?
7. **What is different now?** Only what you can stand behind. *"They stopped
   turning enquiries away because there was nowhere to send people"* is worth
   more than an invented percentage.
8. **Did they say anything in writing** you may quote anonymously?
9. **What may be shown?** Logo, palette, screens, posts, ads — and anything that
   must not appear.
10. **Anything that would identify them** that we should avoid naming.

If you have two or three projects, answer for each; `/work` opens at two.

---

## 5. What changes in the plan

| Item | Before | Now |
| --- | --- | --- |
| P1-1 proof and trust | Narrowed to what needs no permission (named human, response promise, Behance, listings) | **Widened again**: anonymised client work is available, and it is stronger proof than any of those |
| `/work` | Deferred behind a trigger | **In scope at two case studies** |
| `/story` content | The studio's own argument, standing in for a case study | Becomes a real project as soon as §4 is answered |
| Homepage | No proof anywhere | Gains a short proof strip with the first case study |
| Assumption A4 ("no client proof is publishable") | Held since Phase 01 | **Retired.** Phases 02–04 were written under it; none of their conclusions depended on it, and the openings they list are all still valid |

---

## 6. Why nothing was built today

Phase 07 rejected "empty testimonial slots" precisely because an empty proof
component invites filling it dishonestly later. The same reasoning applies to a
portfolio index with nothing in it. The format is ready, the page exists, and
the data file is a five-chapter template — the first real project turns it on in
a single commit.
