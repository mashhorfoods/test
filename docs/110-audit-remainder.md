# The rest of the audit — the ten items after the top five

**7 September 2026.** `docs/109` closed fixes 2–5. This closes what `docs/108`
found beyond them: the §13 priority matrix rows nobody had picked up, and the
questions from §14 *"I still want to know…"*.

Nothing here is a new claim. **Every fact added to the homepage was already
somewhere on the site** — on `/about`, or inside the pricing tables — and was
simply not where the decision gets made.

---

## The ten

| | Item | Done |
| --- | --- | --- |
| 1 | Three work sections a visitor could not tell apart | ✅ galleries merged into one portfolio, two parts |
| 2 | Process at screen 15 of 22 | ✅ moved above the galleries |
| 3 | Two consecutive closing sections | ✅ the "08 Start" banner removed |
| 4 | A discount game before any evidence | ✅ the challenge moved from section 4 to section 14 |
| 5 | No FAQ | ✅ six questions, all answered from existing site copy |
| 6 | *"Who is 'we'?"* | ✅ FAQ — Muhalab Salah, named, no account manager |
| 7 | *"How long will it take?"* | ✅ FAQ — 3–18 working days, from `pricing.json` |
| 8 | *"What if I don't like the design?"* | ✅ FAQ — 1–3 revision rounds, from `pricing.json` |
| 9 | *"Who owns the files?"* | ✅ FAQ — everything delivered, on completion |
| 10 | *"Why are you cheaper?"* | ✅ FAQ — published not quoted; new in these markets, priced accordingly |

Two items from `docs/108` are **not** here and are not forgotten:

- **Remove one of the two prize mechanics.** The audit said pick one. Deleting
  a marketing feature commissioned two days ago is the owner's call, not a
  judgement to make silently, so the challenge was **moved** instead — out of
  section 4, where it offered a stranger a discount game before they had seen
  any evidence, down to section 14, after the portfolio. The reward stays at
  section 10. They are now four sections apart with the whole portfolio
  between them. If you want one gone, say which.
- **"Do you work in my industry?"** needs facts only you have. No industries
  are named anywhere on the site, and inventing a list would be the first
  unbacked claim on it.

---

## 1. The order, before and after

| | before | after |
| --- | --- | --- |
| 1 | hero | hero |
| 2 | services | services |
| 3 | Al Mada proof | Al Mada proof |
| 4 | **the brand challenge** | branding · 01 |
| 5–8 | branding · websites · social · marketing | websites · social · marketing · integrated |
| 9 | integrated | add-ons · 06 |
| 10 | **work gallery** | the reward |
| 11 | add-ons | **process · 07** |
| 12 | the reward | **work gallery** |
| 13 | **process** | **campaign gallery** |
| 14 | **campaign gallery** | **the brand challenge** |
| 15 | **"08 Start" banner** | **FAQ · 08** |
| 16 | contact · 09 | contact · 09 |

Page height is unchanged at 20,583px: the banner that came out paid for the
FAQ that went in.

**What the sequence now does that it did not.** Everything a buyer needs to
decide arrives before anything asking them to play: what you do, proof, the
detail with prices, the extras, **how it works**, then the work itself. The
promotional mechanics sit after all of it, and the last screen before the form
answers the last six objections.

## 2. Two things the moves broke, and how

**The two galleries became one slab.** Putting them adjacent fixes the
"is this new work or the same work again" problem and creates 3,200px of
identical ground — the exact failure `service-detail.css` already warns about
("nine consecutive sections shared one ground… that is not weak rhythm, it is
none"). `#campaigns` now takes the deeper band, which is the same alternation
device the four service blocks use, by id, deliberately.

**The section numbering had a hole in it.** The removed banner held "08", so
the run would have gone 07, 09. The FAQ takes 08 and the run 01–09 stays
unbroken — which also meant `#contact` did not have to be touched.

## 3. The FAQ, and where each answer came from

Native `<details>`: keyboard-operable, announced, works with JavaScript
disabled, and a crawler reads every answer whether or not it is open.

| Question | Source |
| --- | --- |
| Who will I actually be working with? | `/about` — "you deal with the person doing the work, not an account manager" |
| Where are you based? | `/about` — "no office to visit, and that is the point… Riyadh, Dubai and Cairo at the same price" |
| How long does a project take? | `pricing.json` — delivery per package: 3–18 working days; social plans "plan in 3 working days, then posts on schedule" |
| What if I do not like the design? | `pricing.json` — revisions per package: 1–3 rounds |
| Who owns the files at the end? | `pricing.json` `terms.shared.ownership` — "Everything delivered, on completion" |
| Why are your prices lower? | `/about` — "published… we are new in these markets and priced accordingly, a deliberate position, not a discount that expires" |

Added to the mobile menu and the footer's quick links, not the top bar: the bar
is at six items and the practical ceiling is seven, but someone hunting for
"how long does it take" should not have to scroll to find where the answers
live.

## 4. Verified

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Section order | 16 sections, exactly as tabled above |
| Numbering | 01–09, no gap, no duplicate |
| Page height | 20,583px desktop — unchanged |
| The challenge after its move | starts, shuffles, grades — state `quiz` on start |
| The reward after its move | intact |
| FAQ | 6 entries, open/close working, accent border on open |
| Bands | process `#141414` · work transparent · campaigns `#141414` |
| Console errors | 0 |

---

## Still the owner's

| | | |
| --- | --- | --- |
| 🔴 | **One named client testimonial** | The single largest trust gain on the site. `docs/108` §8 |
| 🟠 | **A mailbox on the domain** | Then one field in `site.config.json` |
| 🟠 | **A response time** | "We reply within X" needs a number you will hold to |
| 🟡 | **Which prize mechanic to keep**, if either | Both now sit late and far apart; removing one is a product decision |
| 🟡 | **Industries served**, if you want that answered | Facts only you have |
| 🟡 | **Arabic review** of the new strings | Six FAQ questions and their answers, plus `docs/109`'s six — into the B3 batch |
