# The story chapters in Arabic — review checklist

The Al Mada case study is the most literary Arabic on this site and the most
likely to read as translated rather than written. This is that review, split
into what was **fixed** (verifiably wrong), what was **decided** (a judgement,
answered on the owner's instruction with the reason attached), and what is
still **blocked on Al Mada** — three items no amount of language review can
settle, because they are facts about the client's business.

Source: `src/data/story.json`. Changing it rebuilds the page — the composition,
the sketches and the motion do not care which words they carry.

---

## Part 1 — fixed, because these were errors rather than taste

| # | Was | Now | Why |
| --- | --- | --- | --- |
| 1 | **سطح / أسطح** for *surface* (title, standfirst, two chapters) | **واجهة / واجهات** | A calque. سطح is a physical surface or a rooftop; a brand touchpoint is not one. The title itself read oddly |
| 2 | **خط القاهرة** | **خط Cairo** | A typeface name is a name. "خط القاهرة" says *the font of the city of Cairo* |
| 3 | **يستطيع العميل الدفاع عنها داخليًا** | **يستطيع صاحبها أن يشرحها لغيره** | *Defend internally* is corporate English. A small-business owner does not have an "internal" |
| 4 | **وعدٌ واحد يحمل الشاشة الأولى** | **وعدٌ واحد يتصدّر الشاشة الأولى** | *A promise carries the screen* is an English metaphor that does not travel |
| 5 | **من أنتم، ولماذا أنتم، وماذا تقدّمون…** | **«من نحن»، و«لماذا المدى»، و«خدماتنا»، و«كيف نعمل»، و«قيمنا»، و«تواصل معنا»** | *لماذا أنتم* is a calque of *why you* — and the client's site already names these sections. Now it quotes them |
| 6 | **الزُّرق نفسها** | **درجات الأزرق نفسها** | An unusual plural where a normal phrase exists |
| 7 | **لم يُعَد رسم شيء… ولم يحتج الأمر إلى مصمم ثانٍ يُشرح له** | **لم نُعِد رسم شيء… ولم نحتج إلى مصمم ثانٍ نشرح له** | Two passives hiding who did the work, in the one chapter that is about what we did |
| 8 | **يبنيان تصميمًا لم يُصمَّم بعد** | **يكفيان لبناء إعلان لم يُصمَّم بعد** | The original read as a riddle; the English meant a poster nobody has designed yet |
| 9 | **يتخذ قرارًا بشأن الثقة، لا بشأن السعر** | **يتخذ قرار ثقة، لا قرار سعر** | Tighter, and closer to how the sentence works in English |
| 10 | **العلامة هي الشيء نفسه في ثلاثة أماكن** | **ستجد العلامة نفسها في ثلاثة أماكن** | The close is an instruction to the reader; it should address them |
| 11 | **استوديو ثنائي اللغة يبني موقعًا عربيًا أولًا ليس تنازلًا** | **أن يبني استوديو ثنائي اللغة موقعًا عربيًا أولًا ليس تنازلًا** | Found while answering Q8. The sentence said *the studio* is not a concession; the English means the *act* is. Without the مصدر, ليس takes the studio as its اسم and the claim lands on the wrong noun |
| 12 | **مجموعة حملات عروض العمرة** | **مجموعة الحملات الإعلانية لعروض العمرة** | A four-term إضافة chain. Arabic can carry two comfortably; four makes the reader hold three genitives open before the sentence's verb arrives. The preposition breaks it |

---

## Part 2 — the eight language decisions, answered

Answered on 4 September 2026 on the owner's instruction. **All eight kept the
chapters as written** — but two of them surfaced errors while being argued, and
those became fixes 11 and 12 above. Overrule any of these and it is one edit in
`src/data/story.json`.

**Terminology**

1. **واجهات stays**, over نقاط تماس and أماكن. نقاط تماس is the textbook
   rendering of *touchpoints* and reads as agency jargon — wrong for a page
   whose reader is another small-business owner, and wrong for a site that
   refuses jargon everywhere else. أماكن is too slight to carry a title.
   واجهات also earns the aside: *أربع واجهات، وعادةً أربع جهات* only works
   because the two words rhyme.
   **Note the deliberate 4-vs-3:** the title says أربع واجهات, the close says
   ثلاثة أماكن. That is not a slip in either language — the brand is one of
   the four, and it is the thing appearing in the other three. Please don't
   "correct" it later.

2. **برامج السفر stays**, not باقات السفر — and the collision with the site's
   own باقة is the reason, not an obstacle. برامج is what Saudi agencies
   actually sell (برامج العمرة، برامج سياحية), and reserving باقة for Pixora's
   own priced tiers keeps one word for one meaning across the whole site. A
   reader should never have to work out whose package is being discussed.

3. **الملف التعريفي stays**, not بروفايل الشركة. Same rule that governs
   تتبّع التحويلات on the main site: no transliteration where a settled term
   exists. بروفايل is what people say out loud; it is not what they write in a
   document about a document.

4. **مسار الرحلة stays**, not خط الرحلة. مسار is a trajectory — which is
   exactly what the drawn arc is. خط الرحلة pulls toward خط السير, an
   itinerary, which is a list of stops rather than a shape. مسار also recurs
   in chapter 02 as part of the visual language, so the word is load-bearing.

**Register and tone**

5. **Modern Standard throughout — keep.** Loosening means choosing a dialect,
   and a dialect chooses a market: this page is read in the Gulf and in Egypt.
   The client is Saudi and their own site is MSA, so a colloquial case study
   would be written in a register the subject does not use about itself.

6. **The chapter titles land as confident, not slogan-like — keep.** The test
   is whether the sentence carries a mechanism or only a mood.
   *وكالة السفر تبيع الثقة قبل أن تبيع الرحلة* names a mechanism, and the lead
   underneath it immediately produces the evidence. A slogan would be
   *الثقة أولًا* — a claim with nothing behind it.

7. **حركة داخل اكتمال — keep.** It is the most abstract line on the page, and
   it survives because it does not stand alone: the very next sentence unpacks
   it (*الدائرة للاكتمال والامتداد، ومسار الرحلة للسفر والاتصال*). Abstract
   line, then its own gloss, is a legitimate move in Arabic design writing.
   Both nouns are indefinite, which keeps the two halves parallel.

8. **ليس… بل reads as emphasis, not as translation — keep the construction.**
   النفي والإضراب is native Arabic rhetoric; if anything it sits more
   comfortably in Arabic than the English two-sentence version does in English.
   **But arguing this exposed a real error in the same line** — the sentence
   put ليس on the studio rather than on the act. Fixed as 11 above; the
   construction the question asked about is untouched.

---

## Part 2b — three items blocked on Al Mada

These are **not** language judgements and I have not answered them. Each is a
fact about the client's business or a quotation from their deliverable, and
getting one wrong publishes something untrue about someone else's company on
our own site. They are marked in place and left open.

| # | Blocked item | Who can settle it | Risk if wrong |
| --- | --- | --- | --- |
| **F1** | Chapter 01 says the traveller hands over **مستنداته ومواعيده وأمواله**. Is that how an Umrah booking actually works — do they hand over documents at that stage, or later? | Al Mada, or anyone who has booked with them | We describe a stranger's process to their own customers and get it wrong. It is also the sentence the whole chapter's argument rests on |
| **F2** | **رحلات العمرة وبرامج السفر** as the description of their business — is that how they describe themselves? | Al Mada | Naming someone else's business in words they would not use. If they say عمرة وسياحة, we should |
| **F3** | The six section names quoted in chapter 04 — «من نحن»، «لماذا المدى»، «خدماتنا»، «كيف نعمل»، «قيمنا»، «تواصل معنا» — were read from the **deliverable**, not the live site, which this environment cannot reach. Confirm they are exactly as published | Anyone who can open the site | Quotation marks around words that are not the published words. The marks are the promise; if the site now says «عن المدى» the quote is false |

**F1 and F2 need one message to the client. F3 needs one person to open
madatravel.github.io and read the navigation.** Until then the page is
publishable — nothing in it is known to be wrong — but three sentences are
carrying more confidence than their sourcing supports.

---

### UPDATED 5 September 2026 — the deliverables arrived (`docs/76`)

The four deliverables can now be read directly, which changes three of these
rows and adds one.

| | Status now |
| --- | --- |
| **F1** | **Still open.** Only Al Mada can say when documents change hands |
| **F2** | **Still open, and now sharper.** Their own lockup reads `المدى للسفر والسياحة`, and the campaign sells `عروض العمرة`. Neither confirms nor refutes `رحلات العمرة وبرامج السفر` as *their* description of themselves |
| **F3** | **RETIRED, by removing the risk rather than confirming the fact.** The quotation is gone: chapter 04's Arabic now paraphrases, as its English always did. It matters that the check failed — the deliverable reads `لماذا وكالة المدى؟` where we quoted `لماذا المدى`, and its navigation carries eight items, not six. **A quotation nobody can verify should not have been in quotation marks.** The hero promise stays quoted, because it was verified to the character |
| **F2a** | **NEW, and the most consequential of the four.** Chapter 01 said the agency books for *"Saudi customers"*. Every poster routes **Port Sudan ↔ Jeddah**, by air at 3400 SAR or by ferry at 3200. The clause is **removed, not replaced** — only Al Mada can say who travels, and this project's rule is that nothing is invented. Both languages carried the same wrong claim, so it was never a translation problem |

**What is left on the page is now sourced or absent.** Every remaining
quotation on the Arabic story page is either the brand name `«المدى»` or
`«رحلتك تبدأ بثقة»`, which appears on the website deliverable exactly as
quoted.

---

## Part 3 — what will still be missing afterwards

Separate from F1–F3, and larger than all of them: no amount of language review
adds what chapter 05 does not have — **a result**.
It ends on what was delivered because nothing else was supplied. One sentence
from Al Mada — what changed for them, in their words — is worth more than every
item above, and it is the only part of this page a competitor cannot copy.

---

## Part 4 — verified after these changes

`node build.js` · `tools/validate.js` **0** · `tools/qa.js` **0**. Fixes 11 and
12 are in `src/data/story.json` and rebuilt into `story.html`; the eight
decisions changed nothing else.
