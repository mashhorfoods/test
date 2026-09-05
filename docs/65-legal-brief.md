# Brief for the lawyer reading the Terms

Written 5 September 2026. `docs/62` B4.

**This document is not legal advice and does not attempt any.** It is the
opposite: the questions a lawyer should be paid to answer, with enough context
that answering them is quick. Five documents in this repository say *"a lawyer
should read the Terms, especially cancellation"* and none of them prepared the
reading. An open-ended *"please review this page"* is billed as an
open-ended review; this should be a targeted one.

**What to review:** `/terms` on the live site, in **both** languages.
Source: `src/pages/terms.html`. Roughly 900 words per language.

---

## 1. The facts a reviewer needs before the first clause

| | |
| --- | --- |
| **The contracting party** | **A natural person — Muhalab Salah.** There is no company. The Terms say "a studio run by", which is accurate, and means personal liability is unlimited |
| **Where he is** | Sudan |
| **Where the clients are** | The Gulf and Egypt — Saudi Arabia, UAE and Egypt in practice |
| **Currency** | USD. Prices are published openly on the site |
| **How money moves** | **50% before work starts, 50% before handover.** Monthly packages billed at the start of each month |
| **What is sold** | Brand identity, websites, social media management, advertising. $250–$1,990 one-off; $250–$650 monthly |
| **How a project starts** | A written quote, accepted by the client. Nothing is signed on the website |
| **Language** | The site and the Terms are fully bilingual, English and Arabic, presented as equals |

## 2. The question we most want answered

**Nothing in the Terms says which language version prevails if the two
disagree.**

Both versions are published, both are presented as the terms, and no clause
names one as authoritative. Compounding it: the Arabic has been written and
checked for *completeness* by tooling, but **has never been reviewed by a
native speaker for meaning** (`docs/62` B3, still open). So it is not merely
that no rule exists for a discrepancy — it is that nobody has yet confirmed
there is no discrepancy.

- Does a governing-language clause need adding, and which language should it
  name given the client base is largely Arabic-speaking?
- Does naming English create a problem in any of the three client
  jurisdictions — is a consumer or a business entitled to rely on the Arabic?

This was found while preparing this brief and is the reason it exists.

> **UPDATED 5 September 2026 — `docs/77`.** The second half of this concern is
> resolved. Both versions have now been **compared in full, clause by clause**:
> 67 bilingual pairs, every number checked, no dropped clauses, **no
> substantive discrepancy**. The cancellation, liability, ownership,
> no-result-promised and governing-law clauses each say the same thing in both
> languages.
>
> So the question narrows to one part, and it is entirely a lawyer's:
> **should a governing-language clause be added, and which language should it
> name?** The two versions do not currently disagree — confirmed, not assumed —
> and neither contains such a clause, symmetrically.
>
> The Arabic has still had **no native-speaker review for register** (`docs/69`
> B3 remains open). That matters for tone, not for meaning.

## 3. The clauses that carry real risk, and what each is meant to do

Stated as intent, so the reviewer can say whether the wording achieves it.

### 3.1 Cancellation and the non-refundable deposit — the one already flagged

> *"You can stop a project at any time. What has been completed up to that
> point is payable, and the opening 50% is not refundable once work has begun —
> it pays for work already done."*

**Intent:** the deposit compensates work already performed, not a penalty for
leaving.

- Is a non-refundable deposit enforceable in Saudi Arabia, the UAE and Egypt
  for a business-to-business service of this size?
- Does it change if the client is a sole trader or a consumer rather than a
  company?
- Would tying the retained amount to *work actually done* — rather than to a
  flat 50% — be safer, and is the current wording already close enough?

### 3.2 Limitation of liability

> *"what we owe you is limited to what you paid us for that piece of work. We
> are not responsible for losses beyond it — lost profit, lost data…"*

**Intent:** cap exposure at the fee for the specific piece of work.

- Is a cap at the fee enforceable in those jurisdictions, and are there
  carve-outs that cannot be excluded?
- **Given there is no company, this cap is the only thing between a claim and
  personal assets.** Does that change your advice about forming an entity —
  and is that a stronger reason to form one than the tax or credibility
  reasons? (`docs/60` §3 treats the missing entity as a trust problem; this
  brief asks whether it is also a liability problem.)

### 3.3 Ownership transfer on final payment

> *"Everything we deliver becomes yours on completion — once the work is
> finished and paid for in full. That includes the source files. Until then it
> remains ours."*

**Intent:** the client owns the work outright once paid; retention until then
is leverage, not a permanent claim.

- Does transfer of copyright require a **signed written assignment** in the
  client's jurisdiction, and if so does an accepted written quote referencing
  these Terms satisfy it?
- Logos become **trademarks**. Does anything additional need to happen for the
  client to register one they commissioned?

### 3.4 No promise of a business result

> *"We do not promise a business result… What we promise is the work described,
> done properly."*

**Intent:** exclude outcome guarantees while keeping a real quality obligation.

- Does this read as excluding *all* warranties, including the implied ones that
  cannot be excluded? The intention is narrower than that.

### 3.5 Governing law, deliberately not fixed

> *"the law that applies is named in your written quote rather than fixed
> here."*

**Intent:** flexibility per client rather than imposing one forum.

- **Is deferring it a mistake?** If a quote omits it — and quotes are written by
  hand — is there then *no* agreed governing law?
- Would naming a default here, overridable in the quote, be better?
- Practically: is a judgment obtained in one of these jurisdictions enforceable
  against a person resident in Sudan, and does that make arbitration or a named
  seat worth the extra words?

## 4. Two smaller ones, if they are cheap to answer

- **Published prices.** The site publishes real prices; the Terms say prices may
  change and that a quote governs. Is anything here an offer a client could
  accept unilaterally, rather than an invitation to treat?
- **Portfolio rights.** *"We may show finished work in our portfolio — never
  without asking you first."* Is permission-on-asking sufficient, or is a
  written licence needed to be safe? One real client is already published this
  way, with permission given informally.

## 5. What does **not** need reviewing

Said explicitly, so it is not billed for:

- **The privacy page.** No accounts, no cookies, no server, no data collected —
  the contact form opens the visitor's own mail client. Unless you think that
  itself is worth a second look.
- **Tone, structure, plain-English style.** Deliberate, and we would rather keep
  it than have it become standard boilerplate. **Where a clause must change to
  be enforceable, say so and we will change it** — but a clause that is merely
  unusually plain is fine as it is.
- **The rest of the site.**

## 6. What we will do with the answers

Each answer becomes a change to `src/pages/terms.html` in both languages, or a
recorded decision not to change it and why. `docs/62` B4 closes when that is
done, not when the review arrives.

If the advice is that an entity should exist, that is a larger decision and it
belongs with `docs/60` §3 — where the missing entity is already recorded as the
project's central open item.
