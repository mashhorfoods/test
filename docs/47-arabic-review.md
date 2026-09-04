# Arabic review — the pass before a native speaker

Outstanding since `docs/20-arabic.md`, and carried into production as the
largest quality risk on the Gate 03 list. This is a **systematic review**, not
the native-speaker read that still has to happen — §5 says exactly what the
difference is.

Reviewed: `pricing.json` (labels, features, terms, scope facts), `story.json`,
`i18n-ar.json`, the UI strings in `navigation-map.js`, and every
`data-lang-copy="ar"` span across the six pages — plus the pages **rendered in
Arabic**, because half of these findings are invisible in the source.

---

## 1. The finding that mattered: parity was claimed, not achieved

`docs/20-arabic.md` recorded Arabic as complete, and `data-i18n-pending`
genuinely appears nowhere. But that check only covered **prose**. The package
data was never audited the same way:

| | |
| --- | --- |
| **15 features** carried English text inside the `ar` field | *Typography System*, *Content Calendar*, *Stories*, *Copywriting*, *Graphic Design*, *Video Editing*, *Publishing & Scheduling*, *Community Management*, *Monthly Performance Report*… |
| **22 features had no `ar` field at all** | the entire Marketing & Ads category — all three packages, every line |

An Arabic-speaking buyer reading the Ads packages — the monthly products, the
recurring revenue — saw an English list under an Arabic heading and an Arabic
price. **All 109 feature lines now have Arabic**, and the check is trivial to
repeat: no `ar` key, or an `ar` value with no Arabic letters in it, is a bug.

---

## 2. Numerals: two systems on one card

The scope facts drafted for Phase 18 used Arabic-Indic digits (`٥–٧ أيام عمل`)
while the rest of the site — including every price directly above them — uses
Western digits (`290 دولار`, `3 تصاميم`). One card showed both.

Normalised to Western digits throughout, because the prices cannot move: they
are the same figures in both languages, and Gulf and Egyptian web content
overwhelmingly sets numerals this way. `٥٠٪` became `50%` for the same reason.

---

## 3. Voice: the band spoke in a different person

The verification band said **أعمل عن بُعد** — *I work remotely* — while every
other line on the site speaks as **we** (*نبني*, *نقدّم*, *نردّ*). The English
band is impersonal, so the Arabic had quietly introduced a first-person voice
that appears nowhere else. Now **نعمل**.

---

## 4. Wording, one by one

| Was | Now | Why |
| --- | --- | --- |
| `تحقّق منّا:` | `تحقّق بنفسك:` | "Check us" as an imperative reads as *verify us*; the English means *see for yourself* |
| `كل ما يُسلَّم، عند الانتهاء` | `كل ما نسلّمه لك، عند الانتهاء` | A fragment with no actor. The English has one |
| `الطباعة والتنفيذ` | `الطباعة وتنفيذ المطبوعات` | *التنفيذ* alone is broad enough to read as "execution of the work" — the opposite of an exclusion |
| `كمّان مختلفان من العمل` | `مقداران مختلفان من العمل` | Correct but stiff; *مقدار* is the ordinary word |
| `الربط.` | `الربط والتكاملات.` | *Integrations* is the term buyers use |
| `يحتاج الموقع أن يتحدث إليه` | `يحتاج الموقع إلى الاتصال به` | The English metaphor does not carry |
| `كلفة` | `تكلفة` | The common written form |
| `يمكنك التوقف` | `يمكنك إيقافها` | The subject is the package, not the client |
| `إعلانات Meta وGoogle` | `إعلانات Meta و Google` | **Only visible when rendered:** an Arabic conjunction glued to a Latin word came out as one mangled token in RTL |

---

## 5. What a native speaker still has to decide

This pass fixed what is verifiably wrong. It cannot settle what is merely
*unnatural*, and that list is real:

- **Register.** The Arabic is Modern Standard throughout. Whether a Riyadh or
  Cairo small-business owner reads that as professional or as stiff is a
  judgement no rule decides.
- **Terminology.** *باقة* for package, *الهوية البصرية*, *مونتاج الفيديو* vs
  *تحرير الفيديو*, *الوسوم* vs *الهاشتاقات* — each is defensible; which one the
  buyer actually searches for is local knowledge.
- **Marketing tone.** The English is deliberately plain and confident. Arabic
  marketing copy in this market often runs warmer. Matching the English exactly
  may itself be the wrong choice.
- **The case study.** The Al Mada chapters are the most literary Arabic on the
  site and the most likely to read as translated rather than written.
- **Gulf vs Egypt.** One Arabic serves both here. A native reader may find that
  it lands better in one than the other.

**Recommendation:** one hour with a native speaker, reading the site in Arabic
on a phone, with permission to change any wording they want. Nothing above is
load-bearing enough to argue over.

---

## 6. Verified after the changes

`node build.js` · `tools/validate.js` **0 findings** · `tools/qa.js`
**0 findings** — including the bilingual check, which compares the count of
English and Arabic copies on every page.

109 of 109 package features carry Arabic. No Arabic-Indic digit remains in a
document that prices in Western ones.
