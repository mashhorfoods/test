# B4 — the facts under the legal brief, re-checked

> **SUPERSEDED 6 September 2026 — send `docs/90` instead.** The findings here
> are carried into it, chiefly §2's point that every route to a binding
> agreement runs through WhatsApp or the visitor's own mail client. `docs/90`
> §3.6 turns that into the questions a reviewer can answer, and adds one this
> file predates: **the site now composes the client's first message**, naming a
> package and a price.


`docs/69` P2 B4. Written 5 September 2026.

**This answers no legal question and attempts no legal advice**, which is
`docs/65`'s own opening position and the reason B4 exists. A lawyer is still
needed and **B4 does not close.**

What this does is the part that makes an hour of legal time cheaper: **check
that every fact `docs/65` §1 puts in front of the reviewer is still true**, and
add the one that today's work produced and the brief does not carry.

---

## 1. The facts, re-verified against the site as it is now

| `docs/65` §1 says | Checked | |
| --- | --- | --- |
| A natural person, Muhalab Salah, no company | Terms clause 6 says *"a studio run by"* in both languages | ✅ |
| Where he is: **Sudan** | Terms publish `+249 962672192` | ✅ |
| Currency **USD**, prices published openly | `pricing.json` | ✅ |
| **50% before work, 50% before handover**; monthly at the start of each month | Terms clause 13, both languages | ✅ |
| **$250–$1,990 one-off; $250–$650 monthly** | Live values are 250, 400, 490, 600, 650, 990, 1200, 1990 — range correct, and it **already reflects the branding reprice** to 490/990/1990 | ✅ |
| A written quote, accepted by the client; nothing signed on the website | Terms clauses 3, 8, 10 | ✅ |
| Fully bilingual, presented as equals | 39 pairs, and `docs/77` confirms they **agree in substance** | ✅ |

**Nothing in §1 is stale.** One row is now incomplete rather than wrong, and it
is §2 below.

## 2. The fact the brief does not carry: how a contract actually reaches a client

§1 says *"A written quote, accepted by the client."* True — and it does not say
**through what channel**, which turns out to be the material part.

Measured across the eight shipped pages:

| Route | Count |
| --- | ---: |
| **WhatsApp links** | **28** |
| `mailto:` links | 4 |
| `tel:` links | 1 |
| Visible links in total | 299 |

And the contact form does not submit anywhere. Its markup is
`action="mailto:muhalabsalah@gmail.com" method="post"` — **it opens the
visitor's own mail client.** No server receives anything, ever (`docs/65` §5
already told the reviewer not to review the privacy page for this reason; the
same fact turns out to matter on the contract side).

**Then today supplied the case study.** The email to the only named client,
Al Mada, **bounced** — `550 5.1.1 … does not exist` — and the channel that
reached them was **WhatsApp** (`docs/50` Parts 4 and 8).

So, stated plainly for the reviewer:

> **Every route from this website to a binding agreement runs through WhatsApp
> or through the visitor's own email client. Nothing is submitted to, stored
> by, or received on a server the studio controls.**

## 3. What that sharpens — questions, not answers

These are additions to `docs/65` §3, in the same spirit: intent stated, so the
reviewer can say whether the wording achieves it. **None is answered here.**

### 3.1 Is a WhatsApp quote a "written quote"?

Clauses 3, 8, 10, 22 and 37 all rest on *"your written quote"* — it beats the
Terms on conflict, it starts the project, it fixes the price for 14 days, and
**it names the governing law.** If quotes are sent and accepted in a WhatsApp
thread:

- Is that "written" for the purposes of the client's jurisdiction?
- Clause 37 defers governing law to the quote. **If the quote is a chat
  message that names no law, is the governing law simply unnamed?** `docs/65`
  §3.5 already asked whether deferring is a mistake; this is the concrete way
  it goes wrong.

### 3.2 Does it satisfy the signed-writing question already asked?

`docs/65` §3.3 asks whether copyright transfer needs **a signed written
assignment**, and whether an accepted written quote referencing these Terms
satisfies it. **The answer may differ for a PDF quote and a WhatsApp
acceptance**, and the working channel is the second one.

### 3.3 The record is a chat log

If the agreement, its acceptance and its variations all live in WhatsApp, that
thread is the entire evidentiary record. Whether that is adequate — and whether
anything should be mirrored to email or a signed document — is a question worth
one line of the reviewer's answer.

### 3.4 A form that reaches nobody

`docs/65` §4 asks whether published prices are an offer a client could accept
unilaterally. Worth pairing with: **the website's own "send us a brief" form
submits to nothing.** A visitor can complete it, press send, and — if their
mail client does not open or send — no message exists. `docs/68` task 4 treats
that as the most expensive usability defect on the site; the reviewer may see a
second angle on it.

## 4. What `docs/77` already closed

`docs/65` §2's headline was the governing-language gap, and it had two parts.
**One is now answered:** both versions were compared in full and they agree, so
the question is no longer *"do they disagree?"* but only *"should a clause name
one, and which?"* `docs/65` §2 is updated in place.

## 5. What is still entirely the lawyer's

Unchanged and untouched by this document: whether a non-refundable deposit is
enforceable in Saudi Arabia, the UAE and Egypt; whether a liability cap at the
fee holds and what cannot be excluded; whether copyright transfer needs a
signed assignment; whether *"we do not promise a business result"* reads wider
than intended; whether deferring governing law is a mistake; and whether the
absence of a company is a liability problem as well as a trust one.

**Send them `docs/65`, and this alongside it.** The second is shorter and it is
all facts.
