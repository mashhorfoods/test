# Brief for the Arabic reviewer

Written 5 September 2026. `docs/62` B3.

**One hour, on a phone, reading Arabic.** `docs/47` §5 recommended exactly that
and named the questions; this says what to read first and why, because the site
has ~6,200 Arabic words and an hour does not cover them evenly.

**You have permission to change any wording you want.** Nothing here is
load-bearing enough to argue over — except §1, which is.

---

## 1. The finding that reorders everything

**Two pages have never been through any Arabic review — and one of them is a
contract.**

`docs/47` and `docs/49` were the systematic passes. Both were written on 4
September; `terms.html` and `accessibility.html` were written *later the same
day*. Neither review covers them. Every mention of "terms" in those documents
refers to the scope facts inside `pricing.json`, or to *terminology* — not to
the Terms of Service page.

| Page | Arabic words | Reviewed? |
| --- | ---: | --- |
| **`/terms`** | **670** | **No. Never, by anyone** |
| **`/accessibility`** | **500** | **No. Never, by anyone** |
| `/` homepage | 2,192 | Yes — `docs/47`, `docs/49` |
| `/pricing` | 1,694 | Yes |
| `/story` | 505 | Yes, and flagged as the most literary |
| `/privacy` | 352 | Yes |
| `/about` | 279 | Yes |

**Why `/terms` is now the first thing to read.** It is the only page on this
site that is a contract. It states a 50% non-refundable deposit, who owns the
work, and what happens if either side stops. And a separate brief for a lawyer
(`docs/65` §2) has just asked **which language version governs if the two
disagree** — a question nobody can answer while nobody has checked whether they
*do* disagree.

So the request for `/terms` is different from the rest of the site:

> **Not "does this read well" but "does the Arabic say the same thing as the
> English".** Where it does not, that is a defect rather than a preference, and
> it is the most valuable thing this hour can find.

The English is in the same file beside every Arabic string, so the comparison
is possible without switching pages.

## 2. Reading order

Ordered by what a wrong word costs, not by length.

| | Page | Look for |
| --- | --- | --- |
| **1** | `/terms` | **Meaning, against the English.** Contract terms, per §1 |
| **2** | `/` homepage | Register and tone. It is 2,192 words and the first thing a buyer reads — skim, do not audit |
| **3** | `/pricing` | Package names and feature lines. This is where a wrong *term* costs a sale, because it is what someone searches for |
| **4** | `/story` | `docs/47` §5 calls this "the most literary Arabic on the site and the most likely to read as translated rather than written." Does it? |
| **5** | `/accessibility`, `/privacy`, `/about` | Only if there is time |

## 3. The decisions already open, with the current choice shown

From `docs/47` §5. Each is defensible; the question is which one this market
actually uses. **A one-word answer is a complete answer.**

| | Currently | The question |
| --- | --- | --- |
| Package | **باقة** | Right for a Gulf/Egypt small-business buyer? |
| Brand identity | **الهوية البصرية** | Or something else? |
| Video editing | **مونتاج الفيديو** | Or **تحرير الفيديو**? |
| Hashtags | **الوسوم** | Or **الهاشتاقات**? |
| Register | Modern Standard throughout | Professional, or stiff? |
| Marketing tone | Matches the English — plain and confident | Arabic marketing here often runs warmer. **Is matching the English itself the wrong choice?** |
| One Arabic for both markets | Gulf **and** Egypt | Does it land in one better than the other? If so, which, and does it matter? |

**One rule already settled, so it is not re-litigated:** numerals are Western
(`0-9`) everywhere, in both languages — `docs/47` §2 and `docs/49` §7. A page
whose prices are Western-numeralled and whose body text is not asks a reader to
switch systems mid-sentence. `qa.js` now fails the build on an Arabic-Indic
digit, so this one is enforced rather than remembered.

## 4. What not to spend the hour on

- **Whether a string exists.** Tooling proves that already: every English
  string has an Arabic sibling on every page, and the build fails otherwise.
- **Direction, mirroring, fonts.** Handled and verified.
- **The English.** Deliberately plain. If the Arabic should be warmer than the
  English, say so — that is §3's last row — but the English is not changing.

## 5. Giving the answers back

`docs/49` Part 3 has the file map, and **marking a printout is fine** — send it
back and it gets applied. Two additions to that table, which was written before
these pages existed:

| Content | File |
| --- | --- |
| **The Terms page** | **`src/pages/terms.html`** |
| **The Accessibility page** | **`src/pages/accessibility.html`** |

Both are English and Arabic side by side in the same file, as everywhere else.

## 6. What happens to the answers

Wording changes are applied and the build re-run. **A meaning discrepancy in
`/terms` is different**: it goes to `docs/65` as an input to the lawyer's
question about which language governs, and it changes the page in both
languages rather than only the Arabic.

`docs/62` B3 closes when the answers are applied, not when the review happens.
