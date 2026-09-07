# Visitor audit — Pixora, seen by someone who has never heard of it

**7 September 2026.** Requested as a first-time-visitor / potential-customer
audit: not a design review, and not judged on whether it looks good.

Everything below was taken from the shipped build (`46dcb25`) by walking the
site, not from the source. Measurements and quotes are literal.

---

## 1. First impression — the first 5–10 seconds

**What I see (desktop, 1440×900):** a dark, gold-accented hero. Eyebrow
"CREATIVE DIGITAL PARTNER". Headline **"Your Brand. Your Digital Presence. One
Partner."** One paragraph: *"We build brands, websites and digital experiences
— then connect them with content, social media and performance marketing to
help your business grow."* One button: **Start Your Project**. On the right, an
orbit diagram labelled Branding & Design, Websites, Social Media, Digital
Marketing & Ads, with Growth at the centre.

**What I conclude in 10 seconds**

| Question | My answer as a stranger |
| --- | --- |
| What does this company do? | ✅ Clear — brand, website, social, ads, from one supplier |
| Who is it for? | ❌ **No idea.** Not one word about who the customer is |
| What's the main product? | 🟡 "All of it" — which is a positioning, not a product |
| What do they want me to do? | ✅ Start Your Project |
| Is the value proposition understandable? | 🟡 The *what* yes; the *why you* no |

**What is missing from the first screen.** Any answer to *who is this for*, any
proof, any price signal, any location, and any lower-commitment option than
"Start Your Project". A first-time visitor is not ready to start a project;
they are ready to look.

**What creates hesitation.** "One Partner" is the whole argument and it is
asserted, not shown. Every agency site says something close to this. Nothing on
the first screen distinguishes this from the other five tabs I have open.

**What would make me leave.** Nothing visually — the hero is genuinely
good-looking and buys goodwill. What makes me *bounce later* is 22.6 screens of
scrolling before I meet a single piece of evidence about anyone who has paid
them.

---

## 2. Visitor persona & expectations

Reading the site, the actual buyer appears to be: **a small or mid-sized
business owner in the Gulf or Egypt** who needs a brand and/or a website and is
tired of coordinating a designer, a developer and an ads person separately.

That persona is stated **once, on `/about`**: *"A remote studio for the Gulf and
Egypt"* … *"one studio can serve Riyadh, Dubai and Cairo at the same price."*

**The homepage never says it.** Someone in Cairo cannot tell this site is for
them; someone in London cannot tell it is not.

What that buyer expects before contacting anyone: what it costs, how long it
takes, who they will actually be dealing with, whether anyone else has used
them, and what happens after they send a message.

---

## 3. Section-by-section journey

Sixteen sections, **20,329px on desktop = 22.6 screens**; **23,405px on a phone
= 27.5 screens**.

| # | Section | Communicating | Clear? | Verdict |
| --- | --- | --- | --- | --- |
| 1 | **Hero** | We do all of digital, from one place | Yes | **Keep.** Add who it is for + a second, softer CTA |
| 2 | **What we do** (5 services, accordion) | The catalogue | Yes | **Keep.** Strongest structural section on the page |
| 3 | **Recent work** (bento, Al Mada) | We did four things for one client | Yes | **Keep + promote.** This is the only proof on the site |
| 4 | **The Brand Challenge** (quiz) | Play a game, win a discount | Yes | **Move.** A discount game before I know if they are any good is a shop assistant offering me a voucher at the door |
| 5–8 | **Branding / Websites / Social / Marketing** | Detail + prices per service | Yes | **Keep.** Prices here are a real strength |
| 9 | **One digital partner** | The integration argument, restated | Yes | 🟡 **Compress.** This is the hero's claim a third time |
| 10 | **Selected work** (10-image gallery) | Craft | Partly | 🟡 **Merge with §3.** Two work sections, four sections apart |
| 11 | **Add-ons** | Extras, priced | Yes | **Keep** |
| 12 | **A reward is waiting** (mystery prize) | Second discount mechanic | Yes | 🔴 **Pick one.** Two separate prize games on one page reads as a promo site, not a studio |
| 13 | **How we work** (6 stages) | Process | Yes | **Keep + move earlier.** This answers "what happens if I hire you" and it is at screen 15 |
| 14 | **Campaigns** (8-image gallery) | More craft | Partly | 🟡 **Third work section.** Merge |
| 15 | **Start** | "Let's build your digital presence" + CTA | Yes | 🔴 **Remove or merge.** It is a CTA section immediately before the contact section |
| 16 | **Contact** | Form + WhatsApp + phone + email | Yes | **Keep.** See §9 for the defect in it |

**What a customer expects that never appears:** anyone else's opinion of this
company, at any point, on any page.

---

## 4. Information architecture

The twelve questions a buyer works through, and where this site answers them:

| | Question | Answered? | Where |
| --- | --- | --- | --- |
| 1 | Who are you? | 🟡 Partially | Hero says what, `/about` says who — homepage never |
| 2 | What do you do? | ✅ | Hero + §2, well |
| 3 | Who do you serve? | 🔴 **No** | `/about` only: "Gulf and Egypt" |
| 4 | What problem do you solve? | 🟡 | Implied ("one partner"), never stated as the buyer's pain |
| 5 | Why choose you? | 🟡 | Two real reasons exist — published prices, one named person — both on `/about` |
| 6 | What exactly do you offer? | ✅ | §2 and §5–8, excellent |
| 7 | How does it work? | ✅ | §13 — but at screen 15 of 22 |
| 8 | Can I trust you? | 🔴 **No** | Nothing on the homepage |
| 9 | What evidence? | 🟠 One case study | §3, and it is good |
| 10 | What does it cost? | ✅ **Yes, published** | A genuine differentiator |
| 11 | What happens if I contact you? | 🔴 **No** | No response time, no next step named |
| 12 | How do I take the next step? | ✅ | Multiple routes |

**Proposed sequence** (§12 below).

---

## 5. Repetition & information waste

**Reinforcing (keep):**
- "Start Your Project" appears many times. A long page needs a CTA in reach;
  this is correct.
- Prices repeat per service and again in the contact dropdown. Useful at both
  points.

**Wasting attention (fix):**
- **The "one partner" claim appears four times** — hero headline, §2 heading
  ("Built to Work Together"), §9 (a whole section), footer. By the fourth it
  reads as insistence rather than evidence. §9 should shrink to a band.
- **Three separate work/gallery sections** (§3, §10, §14) at positions 3, 10
  and 14. A visitor cannot tell whether they are seeing new work or the same
  work again. One portfolio section, or one plus a link.
- **Two consecutive closing sections** (§15 "Start" then §16 "Contact"). §15
  adds 710px and one sentence.
- **Two prize mechanics** (§4 challenge, §12 reward). Either alone is a
  legitimate lead magnet. Both, on the same page, cheapens a studio that is
  otherwise arguing for craft.

---

## 6. Content quality

**Genuinely good, and rarer than it sounds:**
- No invented statistics. `/about` states this as policy: *"We do not publish
  numbers we cannot prove. There is no invented statistic, client or
  testimonial anywhere on this site."* That is worth protecting.
- Service copy is concrete: *"Design, build and deployment — handed over as a
  working website, with domain and hosting arranged."* That is a deliverable,
  not an adjective.
- §9's framing is sharp: *"The difference is not what gets made — it is how
  much of the coordinating you have to do yourself."* **This is the best
  sentence on the site and it is at screen 10.** It belongs near the top.

**Weak:**
- The hero is company-facing: "Your Brand. Your Digital Presence. One Partner."
  is three nouns about *them*. Nothing about the buyer's situation.
- "CREATIVE DIGITAL PARTNER" is a category label, not a claim.
- Section 15 — *"Tell us what you are building. We will take it from there."* —
  is 22 words occupying a full section.

**The company-vs-customer test:** the site describes the offering well and the
customer's problem barely at all. The one line that does it (§9) is buried.

---

## 7. Missing information — ranked

| | Missing | Why it matters here |
| --- | --- | --- |
| 🔴 | **Any third-party proof** — a testimonial, a named client quote, a logo, a review | Zero on the entire site. For a studio asking for 490–1990 USD from a stranger abroad, this is the single biggest gap |
| 🔴 | **Who this is for, on the homepage** | "Gulf and Egypt" is on `/about`. A visitor who never clicks About never learns whether this company serves them |
| 🔴 | **What happens after I send a message** | No response time, no "we reply within X", no description of the first call |
| 🟠 | **Who I will be working with, on the homepage** | "Run by Muhalab Salah… you deal with the person doing the work" is a strong, honest differentiator, invisible until `/about` |
| 🟠 | **A business email address** | The contact address is `muhalabsalah@gmail.com` — on a site selling websites and domain setup |
| 🟠 | **Timelines** | Pricing gives delivery days per package; the homepage never says how long anything takes |
| 🟡 | **FAQ** | The obvious questions (revisions? who owns the files? what if I don't like it?) are partly answered inside pricing, never collected |
| 🟡 | **More than one case study** | One is honest; one is also thin |
| ⚪ | **Certifications / partner badges** | Not expected in this market at this price |

---

## 8. Trust & credibility

**Strengthens trust:**
- Published prices, with an explicit reason (`/about`: *"Most studios in this
  region ask you to request a quote; we would rather you could decide whether
  we are worth a conversation before having one."*) — this is the most
  persuasive thing on the site.
- A real named person with public Behance and LinkedIn.
- A real, detailed case study with actual client artwork.
- Full Arabic, first-class, not a translation afterthought.
- The stated refusal to invent proof — and *"We are new in these markets and
  priced accordingly"* is disarming honesty.

**Weakens trust:**
- 🔴 **No one else's voice anywhere.** Every claim is the company's own.
- 🟠 **A gmail address** as the business contact.
- 🟠 **The contact form is `action="mailto:…" method="post"`.** On many desktop
  browsers with no mail client configured this does nothing at all — a visitor
  who fills it in may believe they have made contact when nothing was sent.
- 🟡 Two prize games. Discount mechanics and premium craft pull opposite ways.
- 🟡 No address or city, only +249 numbers. A buyer in Riyadh cannot tell where
  this studio is, and the site never explains that this is deliberate.

**The single piece of evidence that would change the most:** one named client
saying one specific sentence about a delivered project — ideally Al Mada, whose
work is already on the site. One real quote with a name and a company converts
more than any redesign.

---

## 9. Conversion journey

| Stage | State |
| --- | --- |
| **Entry** | Strong. The hero is professional and reads as a real studio |
| **Interest** | Good. §2 is well-built |
| **Understanding** | Good. Services and prices are concrete |
| **Evaluation** | 🔴 **Blocked.** Nothing to weigh — no proof, no comparison, no reason to prefer them beyond price transparency |
| **Trust** | 🔴 **Weak.** All assertion, no third-party evidence |
| **Decision** | 🟡 I know what it costs, not what I get in service terms — response time, timeline, first step |
| **Action** | Clear and plentiful |
| **Friction** | 🔴 **The form.** `mailto:` + `method="post"` is unreliable; and a gmail address undercuts a website studio |

**On the CTAs themselves:** visible, consistent, well-placed, and after the
header CTA was removed the phone action fills the gaps. The problem is not CTA
availability. **It is that a first-time visitor is only ever offered the
highest-commitment action.** There is no "see the work", "see prices", or
"ask one question" step for someone not yet ready to start a project.

---

## 10. Mobile experience

- First screen: **good.** Headline, sub-line and CTA all above the fold at
  393×852. Type is large and readable one-handed.
- **27.5 screens of scrolling** to reach the contact form. That is the single
  biggest mobile problem — the same content that is long on desktop is much
  longer here.
- Service accordions are the right pattern for a phone.
- WhatsApp is well served — five `wa.me` links.
- The phone action bar keeps a call to action in reach without a header CTA.
- Both galleries plus the reel make the middle of the page image-heavy on a
  phone; on a slower connection this is where people leave.

**Can I use it one-handed?** Yes, comfortably. **Would I reach the bottom?**
Probably not.

---

## 11. Competitive expectation gap

What a buyer comparing three agency sites expects, and finds here:

| Expectation | Here |
| --- | --- |
| Portfolio | ✅ One case study + two galleries |
| Services | ✅ Better than most |
| Pricing | ✅ **Better than almost anyone** — most competitors say "request a quote" |
| Testimonials / reviews | 🔴 Absent |
| Team / who I deal with | 🟠 On `/about` only |
| Process | ✅ Six named stages |
| FAQ | 🔴 Absent |
| Response time | 🔴 Absent |
| Location / coverage | 🟠 On `/about` only |
| Bilingual EN/AR | ✅ **Differentiator** — full, not partial |

**Where it can win:** published prices, genuine bilingual parity, and a named
craftsman instead of an account manager. All three are real and all three are
under-sold on the homepage.

---

## 12. Ideal section sequence

```
1  Hero            — add WHO it is for and a second, softer CTA
2  The problem     — §9's line, promoted: "the difference is not what gets
                      made, it is how much coordinating you do yourself"
3  What we do      — the five services (unchanged)
4  Proof           — the Al Mada case + ONE client quote          ← new
5  Why us          — published prices · one named person · EN/AR   ← new band
6  Service detail  — the four blocks with prices (unchanged)
7  Add-ons
8  How we work     — moved up from screen 15
9  Selected work   — ONE portfolio section (galleries merged)
10 Reward OR challenge — one, not two
11 Contact         — with response time and what happens next
```

Net effect: proof and process move above the midpoint; the page loses roughly
three screens to merged duplication.

---

## 13. Priority matrix

| Priority | Problem | Why it matters | Action |
| --- | --- | --- | --- |
| 🔴 Critical | Zero third-party proof anywhere | A stranger is asked for 490–1990 USD on the company's word alone | Get one named client quote — Al Mada — and put it beside the case study |
| 🔴 Critical | Contact form is `mailto:` + `method="post"` | A visitor can believe they made contact when nothing was sent | Move to a real form endpoint, or make WhatsApp the primary route and label the form honestly |
| 🔴 Critical | Homepage never says who it serves | A Cairo buyer cannot tell it is for them | Put "Gulf and Egypt, remote" in the hero |
| 🟠 High | The best argument is at screen 10 | §9's coordination line is the actual value proposition | Promote it to section 2 |
| 🟠 High | Business email is a gmail address | A studio selling domains and websites using a free mailbox | `hello@` on the existing domain |
| 🟠 High | No answer to "what happens after I contact you" | The last doubt before acting | One line: reply time + first step |
| 🟡 Medium | Three work sections, two prize games, two closing sections | ~3 screens of duplication on a 22.6-screen page | Merge to one portfolio, one mechanic, one close |
| 🟡 Medium | Process is at screen 15 | Answers a mid-funnel question at the end | Move above the galleries |
| ⚪ Low | No FAQ | Most answers exist inside pricing | Collect them later |

---

## 14. I still want to know…

Written as the customer, after reading everything:

1. **Has anyone actually hired you?** One case study, no words from the client.
2. **Where are you?** The numbers are +249. Am I dealing with Sudan, the Gulf,
   somewhere else? Does it matter?
3. **Who is "we"?** `/about` says one person. The homepage says "we" and "one
   team". Which is it? *(One person is fine — say so on the homepage.)*
4. **How long will my project take?** Pricing lists delivery days; nothing
   earlier does.
5. **What happens after I press Start Your Project?** A call? A form? A quote?
   Who replies, and when?
6. **What if I don't like the design?** Revisions are in pricing; a nervous
   buyer wants it before that.
7. **Who owns the files?** Pricing says "everything delivered, on completion" —
   good, and it should be louder.
8. **Do you work in my industry?** No industries named anywhere.
9. **Why is this cheaper than agencies I know?** `/about` answers this honestly
   — and a buyer will ask it long before they reach `/about`.
10. **Is the discount game a real discount, or the real price?** Two prize
    mechanics make a buyer suspect the list price is padded.

---

## 15. Final verdict

### 🟡 MAYBE — I need more information

> **ANSWERED 7 September, the same day.** The verdict below turns on one
> sentence — *"every single claim on this site comes from the company
> itself"* — and that sentence is no longer true. Faris Mohammed, Founder &
> CEO of Al Mada Travel & Tourism Agency, sent a testimonial in writing and
> agreed to be named. It is on the homepage, under the four deliverables it is
> about, and at the end of the case study: `docs/122`.
>
> **The audit is left exactly as it was written.** It was right, it was right
> for the right reason, and a first-visit audit edited after the fact to look
> prescient is worth nothing. §16's first item was the correct first item.

Not "no": the site is professional, the services are clear, the prices are
published, and the case study is real. It clears the bar most agency sites in
this bracket do not.

Not "yes": I would not send money or my phone number yet, for one reason —
**every single claim on this site comes from the company itself.** After 22
screens I know exactly what they sell and what it costs, and I have no evidence
that anyone has ever been happy with it. For a remote studio, in another
country, asking a stranger for four figures, that is the gap that decides it.

The honesty is the site's best asset and it is currently unwitnessed. One
sentence from one real client would move this from MAYBE to YES faster than any
amount of design work.

---

## 16. Top five things to fix

1. ✅ **DONE 7 Sep — `docs/122`.** ~~Get one named client testimonial and put it beside the case study.~~ It is beside the case study, on both pages that carry one. Al
   Mada already trusted them with four deliverables. One quote, one name, one
   company — the largest single trust gain available.
2. **Fix the contact form.** `mailto:` with `method="post"` can silently fail;
   a lost enquiry is worse than no form. Real endpoint, or make WhatsApp
   primary and say plainly what the form does.
3. **Say who it is for, in the hero.** "A remote studio for the Gulf and Egypt"
   already exists on `/about`. Move it to where 100% of visitors see it.
4. **Promote the coordination argument to section 2** and give the hero a
   second, lower-commitment CTA ("See the work" / "See prices") beside "Start
   Your Project".
5. **Replace the gmail address with one on the domain,** and add one line
   answering "what happens after I contact you" — reply time and first step.

---

*Nothing above proposes inventing a statistic, a client or a testimonial. The
recommendation is to obtain one real quote, not to write one — which is the
site's own stated policy and the reason it is worth keeping.*
