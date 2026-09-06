# "What We Do" — the first section of the redesign block

**6 September 2026.** WEBSTART X as the source, the owner's instruction. X04's
verdict language (preserve / borrow-as-principle / adapt / improve / reject)
and X06's brief (hierarchy, conversion, density) applied to one section.

---

## 1. What the section was doing, measured

`tools/reference-probe.js` at 393×852:

| | |
| --- | --- |
| Height | 1.54 screenfuls |
| Reading cost | 66 seconds |
| Controls | 6 |
| **Asks** | **1** |

And the thing the numbers do not say until you look: **four of the five
services were a name and a plus sign.** "Websites". "Social Media Management".
Nothing else. A visitor could learn what one service covered; for the other
four they had to click.

That is a list you have to open in order to read, and a list you have to open
is a list most people do not read.

---

## 2. What the competitors do — and the honest limit on this

WebSearch works from this container; **fetching any specific page does not**
(`EGRESS_BLOCKED`, re-confirmed against `prismdigital.ae`). So this is sourced
and not verified, and it is deliberately used only to settle a question that
does not need pixel access.

What the search results do establish is how agencies in this market *describe*
their services. PrezLab's listing is *"presentation design, infographics,
explainer videos, design language adaptation, on-demand graphic design, motion
graphics, social media content design"* — coverage, not a category noun. Prism
leads with what is included rather than what it is called. And the pattern
writing on agency sites in 2026 puts structure to work as a conversion tool:
*"clarifying what each page is responsible for and where the user should go
next."*

None of that requires seeing a layout. **A category noun alone is below the
market's norm**, and our four closed rows were category nouns alone.

The ten-row structural comparison still needs the probe runs (`docs/100` §4).
This section did not wait for them because it did not need them.

---

## 3. The verdicts

| Reference behaviour | Verdict | |
| --- | --- | --- |
| Services described, not merely named | **Adapt** | One line per service, visible while the row is closed. A line, not their paragraph — the paragraph is already in the panel and duplicating it would spend the reading budget this section is trying to protect |
| Portfolio placed before the services list | **Reject, for now** | Section order is R4's, and R4 waits on B5. `docs/55` §6 refused to guess between three structures and X05 did not overrule that refusal |
| Outcome-named categories | **Hold** | `docs/80` §3.1, already recorded as B5's to answer. "Websites" may well be the wrong name; that is a question for buyers, not for me |
| Long capability lists on the surface | **Reject** | We have them, behind the accordion, where they cost nothing to a visitor who is scanning |

---

## 4. What changed

A one-line summary under each service name:

| | |
| --- | --- |
| Branding & Design | One consistent look across every channel. |
| Websites | Designed, built, and handed over working. |
| Social Media Management | Strategy, content and publishing, handled. |
| Digital Marketing & Advertising | Paid campaigns, targeted and measured. |
| Integrated Digital Solutions | All of the above, run as one system. |

**Shown only when the row is collapsed**, and the single condition covers all
three states the page actually has:

| State | `aria-expanded` | Result |
| --- | --- | --- |
| Script, row collapsed | `false` | summary shows |
| Script, row open | `true` | the panel's fuller description supersedes it |
| **No script at all** | absent, every panel open | summary stays hidden — nothing said twice |

Hidden is the default, so a browser without `:has()` gets the page it always
had rather than a duplicated sentence.

Verified, clip-aware — a control inside a collapsed panel keeps a bounding
rect, so a naive visibility test reports five descriptions visible when a
visitor can see one:

```
open=true   summary=n  desc=Y   Branding & Design
open=false  summary=Y  desc=n   Websites
open=false  summary=Y  desc=n   Social Media Management
open=false  summary=Y  desc=n   Digital Marketing & Advertising
open=false  summary=Y  desc=n   Integrated Digital Solutions
```

Exactly one of the two on every row, in every state.

---

## 5. One thing that went wrong, because it is the useful part

The first version indented the summary with `padding-inline-start`. The box is
`border-box`, so `max-inline-size: 46ch` was measured *including* 167px of
padding — leaving 265px for text. A forty-character line wrapped to two with
two thirds of the row empty beside it.

An indent is a margin. The measure is the content. Putting the indent in
padding makes the two fight, and the one that loses is the one you were trying
to set.

---

## 5a. And one the guard caught

The first selector was `.c-service:has(> h3 > [aria-expanded="false"])`. It
worked. But `qa.js` neutralises state attributes before deciding whether a
selector is dead — so it became `:has(> h3 > )`, which is invalid, and the rule
was reported as **unevaluable** rather than checked.

That is a quieter failure than a wrong rule: the CSS was correct, and the thing
meant to be watching it had been switched off by the shape of the selector.
The trigger is the only element inside a service carrying `aria-expanded`, so
the child path bought nothing; dropping it makes the rule both simpler and
visible to the guard.

**A selector the guard cannot read is a selector nothing is guarding.**

---

## 6. What this section still does not answer

- **Its name and its position.** B5.
- **Whether five services is the right number to show at once.** B5.
- **Whether the headline should be outcome-framed** — "Everything Digital.
  Built to Work Together." is feature-framed, and `docs/80` §3.1 flagged that
  as a real question. Still B5's.

The lead still reads *"Five services. Open any one to see what it covers."* —
a sentence about how to operate the interface, in the most-read line of the
section. It survives this pass on purpose: rewriting it is a positioning
decision, and positioning is what the buyer sessions are for.
