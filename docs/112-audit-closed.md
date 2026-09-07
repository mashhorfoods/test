# The visitor audit, closed out

**7 September 2026.** Every item `docs/108` raised, checked against the shipped
build (`fb84b5a`) rather than against memory of having fixed it.

Fourteen of the sixteen items are done. **One is deliberately still open, and
it is the one that decides the verdict.**

---

## 1. The checklist

### The five headline fixes (§16)

| | Fix | State | Evidence on the live build |
| --- | --- | --- | --- |
| 1 | One named client testimonial | 🔴 **OPEN — owner** | 0 testimonial elements on any page. See §3 |
| 2 | Contact form could fail silently | ✅ | `method="get"`, no `enctype`, recovery block present and revealed on submit |
| 3 | Homepage never said who it serves | ✅ | Hero lead opens "A remote studio for the Gulf and Egypt", above the fold on both desktop and phone |
| 4 | Value proposition at screen 10 + only one CTA | ✅ | Coordination line now in **section 2 of 15**; two hero CTAs, both above the fold |
| 5 | Gmail address + no "what happens next" | 🟠 **half** | "What happens next" shipped; the address is unchanged and flagged at its single source |

### The priority matrix (§13)

| | Row | State |
| --- | --- | --- |
| 🔴 | Zero third-party proof | **OPEN — owner** |
| 🔴 | Contact form | ✅ |
| 🔴 | Who it serves | ✅ |
| 🟠 | Best argument buried | ✅ section 2 |
| 🟠 | Business email | 🟠 owner — mailbox must exist first |
| 🟠 | No "what happens after I contact you" | ✅ |
| 🟡 | Three work sections · two prize games · two closes | ✅ one portfolio, one mechanic, one close |
| 🟡 | Process at screen 15 | ✅ **section 10 of 15** |
| ⚪ | No FAQ | ✅ 6 entries, both languages |

### "I still want to know…" (§14)

| | Question | Answered now | Where |
| --- | --- | --- | --- |
| 1 | Has anyone actually hired you? | ❌ | **The open item** |
| 2 | Where are you? | ✅ | Hero + FAQ |
| 3 | Who is "we"? | ✅ | FAQ — Muhalab Salah, named |
| 4 | How long will it take? | ✅ | FAQ — 3–18 working days |
| 5 | What happens after I press the button? | ✅ | Below the form |
| 6 | What if I don't like the design? | ✅ | FAQ — 1–3 revision rounds |
| 7 | Who owns the files? | ✅ | FAQ — everything delivered, on completion |
| 8 | Do you work in my industry? | ❌ | **Owner — facts only you have** |
| 9 | Why cheaper than agencies I know? | ✅ | FAQ |
| 10 | Is the discount game real, or is the price padded? | ✅ | One mechanic now, and it is at section 13, after the portfolio |

---

## 2. What moved, in numbers

| | Audit (6 Sep) | Now |
| --- | --- | --- |
| Homepage sections | 16 | **15** |
| Desktop height | 20,329px · 22.6 screens | **19,970px · 22.2** |
| Phone height | 23,405px · 27.5 screens | 23,526px · **27.6** |
| Hero actions | 1 | **2**, both above the fold |
| Position of the value proposition | section 9 | **section 2** |
| Position of the process | section 13 | **section 10** |
| Position of the first prize mechanic | section 4 | **section 13** |
| Prize mechanics | 2 | **1** |
| Work/portfolio sections | 3, scattered | **2, adjacent, banded apart** |
| Closing sections | 2 | **1** |
| Questions answered before the form | 0 | **6** |
| Third-party proof | 0 | **0** |

**Two rows there are not wins and should not be read as ones.**

- **Phone length did not improve.** 27.5 → 27.6 screens. The reward and the
  closing banner came out; the FAQ went in; it netted to nothing. `docs/108`
  §10 called scroll fatigue "the single biggest mobile problem" and it is still
  true. The honest next move is not more deleting — it is collapsing the four
  long service blocks on a phone the way the Services list already collapses,
  which is a real piece of work and was not in scope here.
- **Third-party proof is still zero.** Not from oversight; see below.

---

## 3. The one that is still open, and why it stays open

`docs/108` was a **🟡 MAYBE**, and the reason was one sentence: *"every single
claim on this site comes from the company itself."*

I re-checked that on the live build rather than assuming. The page has five
elements that a naive search reads as social proof — and none of them are:

```
SPAN.c-addon__quote   (empty)
SPAN.c-addon__quote   (empty)
DIV.c-quote           "Something more specific? These packages cover…"
H3.c-quote__title
P.c-quote__body
```

`.c-quote` is the **request-a-price-quote** block. And the only keyword hit for
"rated" in the whole document is the word **Integrated**. There is no
testimonial, no review, no client logo, no named third party anywhere on the
site.

That is not an oversight, and it should not be fixed by anyone here: the site's
own stated policy is *"We do not publish numbers we cannot prove. There is no
invented statistic, client or testimonial anywhere on this site."* The fix is
to **obtain** one real sentence from Al Mada — who already trusted this studio
with four deliverables — not to write one.

---

## 4. The verdict, re-run

### 🟡 MAYBE — and now for exactly one reason instead of several

The honest reading, and the useful one: **doing fourteen of sixteen items did
not move the verdict, because the sixteenth is the one that decides it.**

What did change is the distance to YES. On 6 September a buyer hit several
gaps: they could not tell who the site was for, the argument for the studio was
ten screens down, the process was at the end, they were offered a discount game
before any evidence, six ordinary questions went unanswered, and the contact
form could fail without telling them. Every one of those is closed. A buyer now
gets a clean, complete, honest run at the decision — and stops at the same
place, for the same reason.

> **One sentence from one real client is the difference between MAYBE and YES.**
> Not a redesign. Not another section. One quote, with a name and a company.

---

## 5. What is left, and who owns it

| | Item | Why it is not mine |
| --- | --- | --- |
| 🔴 | **One named client testimonial** | Has to be real. It is the verdict |
| 🟠 | A mailbox on the domain, then one field in `site.config.json` | The address must receive mail before the site publishes it |
| 🟠 | A response time you will hold to | "We reply within X" needs a number, not a guess |
| 🟡 | Industries served, if you want Q8 answered | Facts only you have |
| 🟡 | Arabic review of the twelve new strings | `docs/109` and `docs/110` list them for the B3 batch |
| 🟡 | Phone scroll length | Collapsing the four service blocks on a phone — a real piece of work, not a trim |

## 6. Verified

Run against `fb84b5a`, the current head:

| | |
| --- | --- |
| `validate` | 0 findings |
| `qa` | 0 high, 0 medium, 1 pre-existing low |
| `a11y` | 0 violations |
| Console errors | 0 |
| Sections | 15, order confirmed |
| Section numbering | 01–09, unbroken |
| Hero | market line + two CTAs above the fold, desktop and phone |
| Form | `get`, no `enctype`, recovery block wired to the live WhatsApp channel |
| FAQ | 6 entries, both languages, `<details>` open/close working |
| Galleries | adjacent, `#work` transparent vs `#campaigns` `#141414` |
| Prize mechanics | 1, at section 13 |
